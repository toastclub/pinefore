import { Static } from "elysia";
import { modernPin } from "../commonSchema";
import { Kysely } from "kysely";
import { Database } from "../../../schema";
import { userEntityBuilderStart } from "be/lib/entity";
import { jsonBuildObject } from "kysely/helpers/postgres";
import { id } from "lib/id";
import { rootDomain } from "../helpers/root-domain";

export default async function pineforeJsonImporter(
  json: {
    pins: Static<typeof modernPin>[];
  },
  user_id: number,
  db: Kysely<Database>
) {
  console.info("Importing pins from Pinefore JSON");
  let entities = json.pins.map((pin) => {
    return {
      url: pin.entity.url,
      domain: rootDomain(pin.entity.url),
      title: "",
    };
  });
  let tags = json.pins.flatMap((pin) => {
    return pin.tags?.map((tags) => {
      return {
        tag: tags,
        user_id,
        entity_id: pin.entity.url,
      };
    });
  });
  let eRes = await db
    .insertInto("entities")
    .values(entities)
    .onConflict((oc) => oc.column("url").doNothing())
    .execute()
    .then(async () => {
      return await db
        .selectFrom("entities")
        .where(
          "url",
          "in",
          entities.map((entity) => entity.url)
        )
        .select(["id", "url"])
        .execute();
    });
  let user_pins = await db
    .insertInto("userentities")
    .values(
      json.pins.map((p) => ({
        entity_id: eRes.find((e) => e.url === p.entity.url)!.id!,
        user_id,
        public: p.public,
        read: p.read,
        created_at: p.created_at,
        updated_at: p.updated_at,
        title_override: p.title,
        description: p.description,
        pinned: true,
      }))
    )
    .returning(["entity_id", "id"])
    .execute();
  let tagRes = await db
    .insertInto("entitytags")
    .values(
      tags.flatMap((t) => {
        let m = eRes.find((e) => e.url === t!.entity_id)?.id;
        if (!m) return [];
        return [
          {
            tag: t!.tag,
            user_id,
            entity_id: m,
            user_entity: user_pins.find((p) => p.entity_id === m)!.id!,
          },
        ];
      })
    )
    .onConflict((oc) => oc.columns(["tag", "entity_id", "user_id"]).doNothing())
    .execute();
  console.info(
    `Imported ${user_pins.length} pins and ${tagRes.length} tags from Pinefore JSON, created ${eRes.length} entities.`
  );
  return eRes.length;
}

export async function pineforeJsonExporter(
  user_id: number,
  db: Kysely<Database>
): Promise<{
  pins: Static<typeof modernPin>[];
}> {
  console.info(`Export requested for ${user_id}`);
  let res = await userEntityBuilderStart(db, { isMe: true })
    .select((e) =>
      jsonBuildObject({
        url: e.ref("url"),
        id: e.ref("entities.title"),
        created_at: e.ref("entities.created_at"),
      }).as("entity")
    )
    .where("userentities.user_id", "=", user_id)
    .execute();
  return {
    pins: res.map((r) => ({
      ...r,
      id: id.gen(r.id),
    })),
  };
}
