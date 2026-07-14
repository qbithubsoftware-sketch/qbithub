/**
 * Seed Notification Automation Engine — 26 templates + demo notifications + reminders.
 *
 * Run with: `npx tsx scripts/seed-notifications.ts`
 *
 * Creates:
 *   - 26 NotificationTemplate rows (7 admin + 8 engineer + 11 customer events × channels)
 *   - Demo in-app notifications (for admin + engineer inbox)
 *   - Demo reminders (for seeded FSM work orders)
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

type TemplateSeed = {
  code: string;
  name: string;
  event: string;
  recipientType: string;
  channel: string;
  subject: string | null;
  body: string;
  htmlBody?: string;
};

const TEMPLATES: TemplateSeed[] = [
  // ============================================================
  // ADMIN EVENTS (7)
  // ============================================================
  {
    code: "admin.engineer_accepts.in_app",
    name: "Admin: Engineer Accepts Job",
    event: "engineer_accepts",
    recipientType: "admin",
    channel: "in_app",
    subject: "Engineer accepted job {{JobNumber}}",
    body: "Engineer {{EngineerName}} has accepted job {{JobNumber}} ({{JobType}}).",
  },
  {
    code: "admin.engineer_rejects.in_app",
    name: "Admin: Engineer Rejects Job",
    event: "engineer_rejects",
    recipientType: "admin",
    channel: "in_app",
    subject: "Engineer rejected job {{JobNumber}}",
    body: "Engineer {{EngineerName}} has rejected job {{JobNumber}} ({{JobType}}). Reason: {{Reason}}. Reassignment required.",
  },
  {
    code: "admin.engineer_rejects.email",
    name: "Admin: Engineer Rejects Job (Email)",
    event: "engineer_rejects",
    recipientType: "admin",
    channel: "email",
    subject: "[Action Required] Job {{JobNumber}} rejected by engineer",
    body: "Dear Admin,\n\nEngineer {{EngineerName}} has rejected job {{JobNumber}} ({{JobType}}).\n\nReason: {{Reason}}\n\nPlease reassign this job to another engineer at your earliest convenience.\n\nView job: {{DashboardURL}}\n\n— QBIT Hub",
    htmlBody: "<div style='font-family:sans-serif;max-width:600px;margin:auto'><h2 style='color:#00639B'>Job Rejected — Reassignment Required</h2><p>Engineer <b>{{EngineerName}}</b> has rejected job <b>{{JobNumber}}</b> ({{JobType}}).</p><p><b>Reason:</b> {{Reason}}</p><a href='{{DashboardURL}}' style='display:inline-block;background:#00639B;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:10px'>View Job</a></div>",
  },
  {
    code: "admin.job_delayed.in_app",
    name: "Admin: Job Delayed",
    event: "job_delayed",
    recipientType: "admin",
    channel: "in_app",
    subject: "Job {{JobNumber}} is delayed",
    body: "Job {{JobNumber}} ({{JobType}}) is past its scheduled time and still in {{JobStatus}} state.",
  },
  {
    code: "admin.job_delayed.email",
    name: "Admin: Job Delayed (Email)",
    event: "job_delayed",
    recipientType: "admin",
    channel: "email",
    subject: "[Alert] Job {{JobNumber}} is delayed",
    body: "Dear Admin,\n\nJob {{JobNumber}} ({{JobType}}) is past its scheduled time and is still in {{JobStatus}} state.\n\nScheduled: {{Date}} at {{Time}}\nCustomer: {{CustomerName}}\n\nPlease review and take action.\n\nView job: {{DashboardURL}}\n\n— QBIT Hub",
  },
  {
    code: "admin.job_completed.in_app",
    name: "Admin: Job Completed",
    event: "job_completed",
    recipientType: "admin",
    channel: "in_app",
    subject: "Job {{JobNumber}} completed",
    body: "Job {{JobNumber}} ({{JobType}}) for {{CustomerName}} has been marked complete by {{EngineerName}}.",
  },
  {
    code: "admin.relocation_completed.in_app",
    name: "Admin: Relocation Completed",
    event: "relocation_completed",
    recipientType: "admin",
    channel: "in_app",
    subject: "Relocation {{JobNumber}} completed",
    body: "Relocation job {{JobNumber}} for {{CustomerName}} has been completed by {{EngineerName}}.",
  },
  {
    code: "admin.service_completed.in_app",
    name: "Admin: Service Completed",
    event: "service_completed",
    recipientType: "admin",
    channel: "in_app",
    subject: "Service {{JobNumber}} completed",
    body: "Service visit {{JobNumber}} for {{CustomerName}} has been completed by {{EngineerName}}.",
  },
  {
    code: "admin.customer_feedback.in_app",
    name: "Admin: Customer Feedback Received",
    event: "customer_feedback",
    recipientType: "admin",
    channel: "in_app",
    subject: "Feedback received for {{JobNumber}}",
    body: "Customer {{CustomerName}} submitted feedback for job {{JobNumber}}. View: {{FeedbackLink}}",
  },
  {
    code: "admin.customer_feedback.email",
    name: "Admin: Customer Feedback (Email)",
    event: "customer_feedback",
    recipientType: "admin",
    channel: "email",
    subject: "New customer feedback for {{JobNumber}}",
    body: "Dear Admin,\n\nCustomer {{CustomerName}} has submitted feedback for job {{JobNumber}}.\n\nView feedback: {{FeedbackLink}}\n\n— QBIT Hub",
  },

  // ============================================================
  // ENGINEER EVENTS (8)
  // ============================================================
  {
    code: "engineer.work_order_assigned.in_app",
    name: "Engineer: Work Order Assigned",
    event: "work_order_assigned",
    recipientType: "engineer",
    channel: "in_app",
    subject: "New job assigned: {{JobNumber}}",
    body: "You have been assigned job {{JobNumber}} ({{JobType}}) for {{CustomerName}} on {{Date}} at {{Time}}.",
  },
  {
    code: "engineer.work_order_assigned.email",
    name: "Engineer: Work Order Assigned (Email)",
    event: "work_order_assigned",
    recipientType: "engineer",
    channel: "email",
    subject: "New job assigned: {{JobNumber}} — {{JobType}}",
    body: "Hello {{EngineerName}},\n\nYou have been assigned a new work order:\n\nJob: {{JobNumber}}\nType: {{JobType}}\nCustomer: {{CustomerName}}\nDate: {{Date}}\nTime: {{Time}}\nLocation: {{CustomerPhone}}\n\nView job details: {{DashboardURL}}\n\n— QBIT Hub",
  },
  {
    code: "engineer.job_updated.in_app",
    name: "Engineer: Job Updated",
    event: "job_updated",
    recipientType: "engineer",
    channel: "in_app",
    subject: "Job {{JobNumber}} updated",
    body: "Job {{JobNumber}} ({{JobType}}) has been updated. Please review the changes.",
  },
  {
    code: "engineer.job_rescheduled.in_app",
    name: "Engineer: Job Rescheduled",
    event: "job_rescheduled",
    recipientType: "engineer",
    channel: "in_app",
    subject: "Job {{JobNumber}} rescheduled",
    body: "Job {{JobNumber}} has been rescheduled from {{OldDate}} to {{NewDate}}. Reason: {{Reason}}.",
  },
  {
    code: "engineer.job_rescheduled.email",
    name: "Engineer: Job Rescheduled (Email)",
    event: "job_rescheduled",
    recipientType: "engineer",
    channel: "email",
    subject: "Job {{JobNumber}} rescheduled to {{NewDate}}",
    body: "Hello {{EngineerName}},\n\nJob {{JobNumber}} ({{JobType}}) has been rescheduled.\n\nOld date: {{OldDate}}\nNew date: {{NewDate}}\nReason: {{Reason}}\n\nView job: {{DashboardURL}}\n\n— QBIT Hub",
  },
  {
    code: "engineer.job_cancelled.in_app",
    name: "Engineer: Job Cancelled",
    event: "job_cancelled",
    recipientType: "engineer",
    channel: "in_app",
    subject: "Job {{JobNumber}} cancelled",
    body: "Job {{JobNumber}} ({{JobType}}) has been cancelled. Reason: {{Reason}}.",
  },
  {
    code: "engineer.job_cancelled.email",
    name: "Engineer: Job Cancelled (Email)",
    event: "job_cancelled",
    recipientType: "engineer",
    channel: "email",
    subject: "Job {{JobNumber}} cancelled",
    body: "Hello {{EngineerName}},\n\nJob {{JobNumber}} ({{JobType}}) has been cancelled.\n\nReason: {{Reason}}\n\n— QBIT Hub",
  },
  {
    code: "engineer.customer_changed.in_app",
    name: "Engineer: Customer Changed",
    event: "customer_changed",
    recipientType: "engineer",
    channel: "in_app",
    subject: "Customer details changed for {{JobNumber}}",
    body: "Customer information for job {{JobNumber}} has been updated. New customer: {{CustomerName}} ({{CustomerPhone}}).",
  },
  {
    code: "engineer.priority_changed.in_app",
    name: "Engineer: Priority Changed",
    event: "priority_changed",
    recipientType: "engineer",
    channel: "in_app",
    subject: "Priority changed for {{JobNumber}}",
    body: "Job {{JobNumber}} priority has been changed to {{Priority}}.",
  },
  {
    code: "engineer.priority_changed.email",
    name: "Engineer: Priority Changed (Email)",
    event: "priority_changed",
    recipientType: "engineer",
    channel: "email",
    subject: "Priority update: {{JobNumber}} now {{Priority}}",
    body: "Hello {{EngineerName}},\n\nThe priority of job {{JobNumber}} ({{JobType}}) has been changed to {{Priority}}.\n\nView job: {{DashboardURL}}\n\n— QBIT Hub",
  },

  // Engineer reminders
  {
    code: "engineer.reminder_1d.in_app",
    name: "Engineer Reminder: 1 Day Before",
    event: "reminder_engineer_1d",
    recipientType: "engineer",
    channel: "in_app",
    subject: "Reminder: {{JobNumber}} tomorrow at {{Time}}",
    body: "Reminder: Job {{JobNumber}} ({{JobType}}) for {{CustomerName}} is scheduled tomorrow at {{Time}}. Product: {{ProductName}}.",
  },
  {
    code: "engineer.reminder_1d.email",
    name: "Engineer Reminder: 1 Day Before (Email)",
    event: "reminder_engineer_1d",
    recipientType: "engineer",
    channel: "email",
    subject: "Reminder: {{JobNumber}} tomorrow at {{Time}}",
    body: "Hello {{EngineerName}},\n\nThis is a reminder for your job tomorrow:\n\nJob: {{JobNumber}}\nType: {{JobType}}\nCustomer: {{CustomerName}}\nDate: {{Date}}\nTime: {{Time}}\nProduct: {{ProductName}}\n\nView job details: {{DashboardURL}}\n\n— QBIT Hub",
  },
  {
    code: "engineer.reminder_2h.in_app",
    name: "Engineer Reminder: 2 Hours Before",
    event: "reminder_engineer_2h",
    recipientType: "engineer",
    channel: "in_app",
    subject: "Reminder: {{JobNumber}} in 2 hours",
    body: "Job {{JobNumber}} ({{JobType}}) at {{CustomerName}} starts in 2 hours.",
  },
  {
    code: "engineer.reminder_30m.in_app",
    name: "Engineer Reminder: 30 Minutes Before",
    event: "reminder_engineer_30m",
    recipientType: "engineer",
    channel: "in_app",
    subject: "Reminder: {{JobNumber}} in 30 minutes",
    body: "Job {{JobNumber}} ({{JobType}}) at {{CustomerName}} starts in 30 minutes. Please start preparing.",
  },

  // ============================================================
  // CUSTOMER EVENTS (11)
  // ============================================================
  {
    code: "customer.job_assigned.whatsapp",
    name: "Customer: Job Assigned (WhatsApp)",
    event: "customer_job_assigned",
    recipientType: "customer",
    channel: "whatsapp",
    subject: null,
    body: "Dear {{CustomerName}}\n\nYour installation for {{ProductName}} has been scheduled.\n\nEngineer: {{EngineerName}}\nDate: {{Date}}\nTime: {{Time}}\n\nTrack your installation here:\n{{TrackingURL}}\n\n— QBIT Hub",
  },
  {
    code: "customer.job_assigned.email",
    name: "Customer: Job Assigned (Email)",
    event: "customer_job_assigned",
    recipientType: "customer",
    channel: "email",
    subject: "Your QBIT installation has been scheduled — {{JobNumber}}",
    body: "Dear {{CustomerName}},\n\nYour installation for {{ProductName}} has been scheduled.\n\nJob Number: {{JobNumber}}\nEngineer: {{EngineerName}}\nDate: {{Date}}\nTime: {{Time}}\n\nTrack your installation here:\n{{TrackingURL}}\n\nIf you need to reschedule, please call {{SupportPhone}}.\n\n— QBIT Hub",
    htmlBody: "<div style='font-family:sans-serif;max-width:600px;margin:auto'><h2 style='color:#00639B'>Your QBIT installation has been scheduled</h2><p>Dear {{CustomerName}},</p><table style='width:100%;border-collapse:collapse'><tr><td style='padding:8px;border:1px solid #ddd;font-weight:bold'>Job Number</td><td style='padding:8px;border:1px solid #ddd'>{{JobNumber}}</td></tr><tr><td style='padding:8px;border:1px solid #ddd;font-weight:bold'>Product</td><td style='padding:8px;border:1px solid #ddd'>{{ProductName}}</td></tr><tr><td style='padding:8px;border:1px solid #ddd;font-weight:bold'>Engineer</td><td style='padding:8px;border:1px solid #ddd'>{{EngineerName}}</td></tr><tr><td style='padding:8px;border:1px solid #ddd;font-weight:bold'>Date</td><td style='padding:8px;border:1px solid #ddd'>{{Date}}</td></tr><tr><td style='padding:8px;border:1px solid #ddd;font-weight:bold'>Time</td><td style='padding:8px;border:1px solid #ddd'>{{Time}}</td></tr></table><a href='{{TrackingURL}}' style='display:inline-block;background:#00639B;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;margin-top:20px'>Track Your Installation</a><p style='margin-top:20px;color:#666;font-size:12px'>Need help? Call {{SupportPhone}}</p></div>",
  },
  {
    code: "customer.engineer_accepted.whatsapp",
    name: "Customer: Engineer Accepted (WhatsApp)",
    event: "customer_engineer_accepted",
    recipientType: "customer",
    channel: "whatsapp",
    subject: null,
    body: "QBIT Hub: Engineer {{EngineerName}} has accepted your job {{JobNumber}}. Scheduled for {{Date}} at {{Time}}. Track: {{TrackingURL}}",
  },
  {
    code: "customer.engineer_on_the_way.whatsapp",
    name: "Customer: Engineer On The Way (WhatsApp)",
    event: "customer_engineer_on_the_way",
    recipientType: "customer",
    channel: "whatsapp",
    subject: null,
    body: "QBIT Hub: Engineer {{EngineerName}} is on the way for your job {{JobNumber}}. ETA shortly. Track: {{TrackingURL}}",
  },
  {
    code: "customer.engineer_arrived.whatsapp",
    name: "Customer: Engineer Arrived (WhatsApp)",
    event: "customer_engineer_arrived",
    recipientType: "customer",
    channel: "whatsapp",
    subject: null,
    body: "QBIT Hub: Engineer {{EngineerName}} has arrived on site for your job {{JobNumber}}. Track: {{TrackingURL}}",
  },
  {
    code: "customer.installation_started.whatsapp",
    name: "Customer: Installation Started (WhatsApp)",
    event: "customer_installation_started",
    recipientType: "customer",
    channel: "whatsapp",
    subject: null,
    body: "QBIT Hub: Installation has started for your {{ProductName}} (Job {{JobNumber}}). Engineer: {{EngineerName}}. Track: {{TrackingURL}}",
  },
  {
    code: "customer.installation_completed.whatsapp",
    name: "Customer: Installation Completed (WhatsApp)",
    event: "customer_installation_completed",
    recipientType: "customer",
    channel: "whatsapp",
    subject: null,
    body: "QBIT Hub: Your installation {{JobNumber}} for {{ProductName}} is now complete. Thank you for choosing QBIT. Track: {{TrackingURL}}",
  },
  {
    code: "customer.installation_completed.email",
    name: "Customer: Installation Completed (Email)",
    event: "customer_installation_completed",
    recipientType: "customer",
    channel: "email",
    subject: "Installation complete — {{JobNumber}} — Report attached",
    body: "Dear {{CustomerName}},\n\nYour installation for {{ProductName}} has been completed successfully.\n\nJob Number: {{JobNumber}}\nEngineer: {{EngineerName}}\nCompletion Date: {{Date}}\n\nYour installation report is attached. Please review it for warranty and service information.\n\nTrack your service history: {{TrackingURL}}\n\nThank you for choosing QBIT Hub.\n\n— QBIT Hub Team",
    htmlBody: "<div style='font-family:sans-serif;max-width:600px;margin:auto'><h2 style='color:#00639B'>Installation Complete ✓</h2><p>Dear {{CustomerName}},</p><p>Your installation for <b>{{ProductName}}</b> has been completed successfully.</p><table style='width:100%;border-collapse:collapse'><tr><td style='padding:8px;border:1px solid #ddd;font-weight:bold'>Job Number</td><td style='padding:8px;border:1px solid #ddd'>{{JobNumber}}</td></tr><tr><td style='padding:8px;border:1px solid #ddd;font-weight:bold'>Engineer</td><td style='padding:8px;border:1px solid #ddd'>{{EngineerName}}</td></tr><tr><td style='padding:8px;border:1px solid #ddd;font-weight:bold'>Completion Date</td><td style='padding:8px;border:1px solid #ddd'>{{Date}}</td></tr></table><p>Your installation report is attached to this email.</p><a href='{{TrackingURL}}' style='display:inline-block;background:#00639B;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;margin-top:20px'>View Service History</a><p style='margin-top:20px;color:#666;font-size:12px'>Need help? Call {{SupportPhone}}</p></div>",
  },
  {
    code: "customer.relocation_started.whatsapp",
    name: "Customer: Relocation Started (WhatsApp)",
    event: "customer_relocation_started",
    recipientType: "customer",
    channel: "whatsapp",
    subject: null,
    body: "QBIT Hub: Relocation of your {{ProductName}} has started (Job {{JobNumber}}). Engineer: {{EngineerName}}. Track: {{TrackingURL}}",
  },
  {
    code: "customer.relocation_completed.whatsapp",
    name: "Customer: Relocation Completed (WhatsApp)",
    event: "customer_relocation_completed",
    recipientType: "customer",
    channel: "whatsapp",
    subject: null,
    body: "QBIT Hub: Relocation of your {{ProductName}} (Job {{JobNumber}}) is complete. Thank you. Track: {{TrackingURL}}",
  },
  {
    code: "customer.relocation_completed.email",
    name: "Customer: Relocation Completed (Email)",
    event: "customer_relocation_completed",
    recipientType: "customer",
    channel: "email",
    subject: "Relocation complete — {{JobNumber}}",
    body: "Dear {{CustomerName}},\n\nRelocation of your {{ProductName}} has been completed successfully.\n\nJob Number: {{JobNumber}}\nEngineer: {{EngineerName}}\n\nView service history: {{TrackingURL}}\n\n— QBIT Hub Team",
  },
  {
    code: "customer.service_started.whatsapp",
    name: "Customer: Service Started (WhatsApp)",
    event: "customer_service_started",
    recipientType: "customer",
    channel: "whatsapp",
    subject: null,
    body: "QBIT Hub: Service visit {{JobNumber}} for your {{ProductName}} has started. Engineer: {{EngineerName}}. Track: {{TrackingURL}}",
  },
  {
    code: "customer.service_completed.whatsapp",
    name: "Customer: Service Completed (WhatsApp)",
    event: "customer_service_completed",
    recipientType: "customer",
    channel: "whatsapp",
    subject: null,
    body: "QBIT Hub: Service visit {{JobNumber}} for your {{ProductName}} is complete. Thank you. Track: {{TrackingURL}}",
  },
  {
    code: "customer.service_completed.email",
    name: "Customer: Service Completed (Email)",
    event: "customer_service_completed",
    recipientType: "customer",
    channel: "email",
    subject: "Service complete — {{JobNumber}} — Report attached",
    body: "Dear {{CustomerName}},\n\nYour service visit for {{ProductName}} has been completed successfully.\n\nJob Number: {{JobNumber}}\nEngineer: {{EngineerName}}\nCompletion Date: {{Date}}\n\nYour service report is attached.\n\nView service history: {{TrackingURL}}\n\n— QBIT Hub Team",
  },
  {
    code: "customer.reminder_1d.whatsapp",
    name: "Customer Reminder: 1 Day Before (WhatsApp)",
    event: "customer_reminder_1d",
    recipientType: "customer",
    channel: "whatsapp",
    subject: null,
    body: "QBIT Hub: Reminder — Your {{JobType}} for {{ProductName}} is scheduled tomorrow at {{Time}}. Engineer: {{EngineerName}}. Track: {{TrackingURL}}",
  },
  {
    code: "customer.reminder_1d.email",
    name: "Customer Reminder: 1 Day Before (Email)",
    event: "customer_reminder_1d",
    recipientType: "customer",
    channel: "email",
    subject: "Reminder: Your {{JobType}} tomorrow at {{Time}}",
    body: "Dear {{CustomerName}},\n\nThis is a reminder for your scheduled service:\n\nJob: {{JobNumber}}\nType: {{JobType}}\nProduct: {{ProductName}}\nDate: {{Date}}\nTime: {{Time}}\nEngineer: {{EngineerName}}\n\nTrack here: {{TrackingURL}}\n\n— QBIT Hub",
  },
  {
    code: "customer.reminder_2h.whatsapp",
    name: "Customer Reminder: 2 Hours Before (WhatsApp)",
    event: "customer_reminder_2h",
    recipientType: "customer",
    channel: "whatsapp",
    subject: null,
    body: "QBIT Hub: Your {{JobType}} ({{JobNumber}}) starts in 2 hours. Engineer {{EngineerName}} will arrive at {{Time}}. Track: {{TrackingURL}}",
  },
];

async function main() {
  console.log("Seeding Notification Automation Engine templates...");

  let created = 0;
  let updated = 0;
  for (const t of TEMPLATES) {
    const result = await db.notificationTemplate.upsert({
      where: { code: t.code },
      update: {
        name: t.name,
        event: t.event,
        recipientType: t.recipientType,
        channel: t.channel,
        subject: t.subject,
        body: t.body,
        htmlBody: t.htmlBody ?? null,
        isActive: true,
      },
      create: {
        code: t.code,
        name: t.name,
        event: t.event,
        recipientType: t.recipientType,
        channel: t.channel,
        subject: t.subject,
        body: t.body,
        htmlBody: t.htmlBody ?? null,
      },
    });
    if (result.createdAt.getTime() === result.updatedAt.getTime()) created++;
    else updated++;
  }
  console.log(`  ✓ ${created} templates created, ${updated} updated (${TEMPLATES.length} total)`);

  // -------- Demo in-app notifications --------
  const admin = await db.user.findUnique({ where: { email: "admin@qbithub.com" } });
  const engineer = await db.user.findUnique({ where: { email: "engineer@qbithub.com" } });

  if (admin && engineer) {
    // Find existing work orders from FSM seed
    const wo1 = await db.workOrder.findUnique({ where: { id: "wo_94281" } });
    const wo2 = await db.workOrder.findUnique({ where: { id: "wo_94280" } });

    if (wo1) {
      // Admin: engineer accepted
      await db.notification.create({
        data: {
          recipientId: admin.id,
          recipientType: "admin",
          title: "Engineer accepted job WO-94281",
          message: "Engineer Alex Chen has accepted job WO-94281 (installation).",
          category: "job",
          priority: "normal",
          actionUrl: `/api/fsm/work-orders/${wo1.id}`,
          actionLabel: "View Work Order",
          workOrderId: wo1.id,
        },
      });
      // Engineer: work order assigned
      await db.notification.create({
        data: {
          recipientId: engineer.id,
          recipientType: "engineer",
          title: "New job assigned: WO-94281",
          message: "You have been assigned job WO-94281 (installation) for Vikram Patel on 14 Jul 2026 at 10:30.",
          category: "job",
          priority: "high",
          actionUrl: `/api/fsm/work-orders/${wo1.id}`,
          actionLabel: "View Job",
          workOrderId: wo1.id,
        },
      });
    }

    if (wo2) {
      // Admin: job completed
      await db.notification.create({
        data: {
          recipientId: admin.id,
          recipientType: "admin",
          title: "Job WO-94280 completed",
          message: "Job WO-94280 (installation) for Vikram Patel has been marked complete by Alex Chen.",
          category: "job",
          priority: "normal",
          readAt: new Date(),
          actionUrl: `/api/fsm/work-orders/${wo2.id}`,
          actionLabel: "View Work Order",
          workOrderId: wo2.id,
        },
      });
    }

    console.log(`  ✓ 3 demo in-app notifications created`);
  }

  // -------- Demo reminders for upcoming work orders --------
  const upcomingWOs = await db.workOrder.findMany({
    where: {
      status: "pending",
      scheduledDate: { gt: new Date() },
      assignedEngineerId: { not: null },
    },
    include: { customer: true, assignedEngineer: true },
    take: 3,
  });

  let remindersCreated = 0;
  for (const wo of upcomingWOs) {
    if (!wo.assignedEngineer) continue;
    // 1 day before
    const due1d = new Date(wo.scheduledDate.getTime() - 24 * 60 * 60 * 1000);
    if (due1d > new Date()) {
      await db.reminder.create({
        data: {
          workOrderId: wo.id,
          recipientType: "engineer",
          recipientId: wo.assignedEngineerId!,
          recipientContact: wo.assignedEngineer.email,
          offsetMinutes: -1440,
          offsetLabel: "1 Day Before",
          channels: JSON.stringify(["in_app", "email"]),
          status: "scheduled",
          dueAt: due1d,
        },
      });
      remindersCreated++;
    }
    // 2 hours before
    const due2h = new Date(wo.scheduledDate.getTime() - 2 * 60 * 60 * 1000);
    if (due2h > new Date()) {
      await db.reminder.create({
        data: {
          workOrderId: wo.id,
          recipientType: "customer",
          recipientId: null,
          recipientContact: wo.customer.phone,
          offsetMinutes: -120,
          offsetLabel: "2 Hours Before",
          channels: JSON.stringify(["whatsapp"]),
          status: "scheduled",
          dueAt: due2h,
        },
      });
      remindersCreated++;
    }
  }
  console.log(`  ✓ ${remindersCreated} demo reminders created for ${upcomingWOs.length} upcoming work orders`);

  console.log("\nDone. Notification Automation Engine seeded.");
  console.log(`\nTemplate breakdown:`);
  const counts = TEMPLATES.reduce((acc, t) => {
    acc[t.recipientType] = (acc[t.recipientType] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  for (const [type, count] of Object.entries(counts)) {
    console.log(`  ${type}: ${count} templates`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
