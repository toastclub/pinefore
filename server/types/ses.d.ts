export type SESEventNotification =
  | SESBounceNotification
  | SESComplaintNotification
  | SESDeliveryNotification
  | SESSendNotification
  | SESRejectNotification
  | SESOpenNotification
  | SESClickNotification
  | SESRenderingFailureNotification
  | SESDeliveryDelayNotification
  | SESSubscriptionNotification;

type SESCommonNotification = {
  mail: {
    timestamp: string;
    messageId: string;
    source: string;
    sourceArn: string;
    sendingAccountId: string;
    destination: string[];
    headersTruncated: boolean;
    headers: { name: string; value: string }[];
    commonHeaders: Record<string, string | string[]>;
    tags: Record<string, string[]>;
  };
};

type BounceTypes =
  | { bounceType: "Undetermined"; bounceSubType: "Undetermined" }
  | {
      bounceType: "Permanent";
      bounceSubType:
        | "General"
        | "NoEmail"
        | "Suppressed"
        | "OnAccountSuppressionList";
    }
  | {
      bounceType: "Transient";
      bounceSubType:
        | "General"
        | "MailboxFull"
        | "MessageTooLarge"
        | "ContentRejected"
        | "AttachmentRejected";
    };

type SESBounceNotification = SESCommonNotification & {
  eventType: "Bounce";
  bounce: BounceTypes & {
    bouncedRecipients: {
      emailAddress: string;
      action?: string;
      status?: string;
      diagnosticCode?: string;
    }[];
    timestamp: string;
    feedbackId: string;
    reportingMTA?: string;
  };
};
type SESComplaintNotification = SESCommonNotification & {
  eventType: "Complaint";
  complaint: {
    complainedRecipients: { emailAddress: string }[];
    timestamp: string;
    feedbackId: string;
    complaintSubType?: string;
    userAgent?: string;
    complaintFeedbackType?:
      | "abuse"
      | "auth-failure"
      | "fraud"
      | "not-spam"
      | "other"
      | "virus";
    arrivalDate?: string;
  };
};
type SESDeliveryNotification = SESCommonNotification & {
  eventType: "Delivery";
  delivery: {
    timestamp: string;
    processingTimeMillis: number;
    recipients: string[];
    smtpResponse: string;
    reportingMTA?: string;
  };
};
type SESSendNotification = SESCommonNotification & {
  eventType: "Send";
  send: {};
};
type SESRejectNotification = SESCommonNotification & {
  eventType: "Reject";
  reject: {
    reason: string;
  };
};
type SESOpenNotification = SESCommonNotification & {
  eventType: "Open";
  open: {
    ipAddress: string;
    timestamp: string;
    userAgent: string;
  };
};
type SESClickNotification = SESCommonNotification & {
  eventType: "Click";
  click: {
    ipAddress: string;
    link: string;
    linkTags: Record<string, string[]>;
    timestamp: string;
    userAgent: string;
  };
};
type SESRenderingFailureNotification = SESCommonNotification & {
  eventType: "Rendering Failure";
  failure: {
    templateName: string;
    errorMessage: string;
  };
};
type SESDeliveryDelayNotification = SESCommonNotification & {
  eventType: "DeliveryDelay";
  deliveryDelay: {
    delayType:
      | "InternalFailure"
      | "General"
      | "MailboxFull"
      | "SpamDetected"
      | "RecipientServerError"
      | "IPFailure"
      | "TransientCommunicationFailure"
      | "BYOIPHostNameLookupUnavailable"
      | "Undetermined"
      | "SendingDeferral";
    delayedRecipients: {
      emailAddress: string;
      status: string;
      diagnosticCode: string;
    }[];
    expirationTime: string;
    reportingMTA?: string;
    timestamp: string;
  };
};
type SESSubscriptionNotification = SESCommonNotification & {
  eventType: "Subscription";
  subscription: {
    contactList: string;
    timestamp: string;
    source: string;
    newTopicPreferences: TopicPreferences;
    oldTopicPreferences: TopicPreferences;
  };
};
type TopicPreferences = {
  unsubscribeAll: boolean;
  topicSubscriptionStatus: {
    //topicName: EmailTopic;
    subscriptionStatus: "OptIn" | "OptOut";
  }[];
  topicDefaultSubscriptionStatus: {
    //topicName: EmailTopic;
    subscriptionStatus: "OptIn" | "OptOut";
  }[];
};
