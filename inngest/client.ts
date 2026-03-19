import { Inngest, staticSchema } from "inngest";

type Events = {
  // Fired by orchestrators to process one newsletter's full generation + delivery pipeline
  "newsletter/run": {
    data: {
      newsletterId: string;
    };
  };

  // Fired by newsletter-worker after rendering — one per subscriber for fan-out delivery
  "newsletter/email.generated": {
    data: {
      digestRunId: string;
      newsletterTitle: string;
      userId: string;
      userEmail: string;
      emailHtml: string;
    };
  };
};

export const inngest = new Inngest({
  id: "the-latest",
  schemas: staticSchema<Events>(),
});
