import { Injectable, LoggerService } from "@ambrosia-unce/core";

@Injectable()
export class NotificationService {
  constructor(private logger: LoggerService) {
    this.logger = logger.child("NotificationService");
  }

  async sendEmail(to: string, subject: string) {
    this.logger.info("Sending email", { to, subject });
  }

  async sendPush(userId: string, message: string) {
    this.logger.info("Sending push", { userId, message });
  }
}
