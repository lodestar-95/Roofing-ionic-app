import { Injectable } from '@angular/core';
import { AuthService } from '../login/services/auth/auth.service';
import { EmailComposer, EmailComposerOptions } from '@awesome-cordova-plugins/email-composer/ngx';
import { GeneralService } from '../estimate/calculation/materials/general.service';
import { Platform } from '@ionic/angular';
import { CatalogsService } from './catalogs.service';

@Injectable({
    providedIn: 'root'
})
export class PurchaseOrderService {
    constructor(private authService: AuthService,
        private emailComposer: EmailComposer,
        private generalService: GeneralService,
        private platform: Platform,
        private catalogService: CatalogsService) {
    }

    async sendPurchaseOrder(supplierId: number, attachments = []) {
        const canSendEmailToSupplier = await this.currentUserCanSendEmail();
        const emailTo = await this.generalService.getConstValue('purchase_mail_to');

        const mailTo = canSendEmailToSupplier
            ? (await this.getSupplierEmail(supplierId) ?? emailTo)
            : emailTo;

        const mailCC = await this.generalService.getConstValue('purchase_mail_cc');
        const mailCCO = await this.generalService.getConstValue('purchase_mail_cco');
        const mailSubject = await this.generalService.getConstValue('purchase_mail_subject');
        const mailBody = await this.generalService.getConstValue('purchase_mail_body');

        if (this.platform.is('cordova')) {
            this.emailComposer.getClients().then(apps => {
                const email: EmailComposerOptions = {
                    to: mailTo,
                    cc: mailCC,
                    bcc: mailCCO,
                    subject: mailSubject,
                    body: mailBody,
                    attachments: attachments,
                    isHtml: true
                };
                this.emailComposer.open(email);
            });
        }
    }

    async getSupplierEmail(supplierId: number) {
        const suppliers = (await this.catalogService.getSuppliers()).data;
        const supplier = suppliers.find(x => x.id == supplierId);
        return supplier.email;
    }

    async currentUserCanSendEmail(): Promise<boolean> {
        const currentUser = await this.authService.getAuthUser();
        return currentUser?.can_send_email ?? false;
    }
}
