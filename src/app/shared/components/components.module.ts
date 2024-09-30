import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckboxListComponent } from './checkbox-list/checkbox-list.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { VerifiedInformationComponent } from './verified-information/verified-information.component';
import { ProspectingDetailComponent } from './prospecting-detail/prospecting-detail.component';
import { NoDataComponent } from './no-data/no-data.component';
import { CalendarComponentComponent } from './calendar-component/calendar-component.component';
import { PhoneFormatPipe } from 'src/app/pipes/phone-format.pipe';

@NgModule({
  declarations: [
    CheckboxListComponent,
    VerifiedInformationComponent,
    ProspectingDetailComponent,
    NoDataComponent,
    CalendarComponentComponent,
    PhoneFormatPipe
  ],
  imports: [CommonModule, IonicModule, FormsModule],
  exports: [
    CheckboxListComponent,
    VerifiedInformationComponent,
    ProspectingDetailComponent,
    NoDataComponent,
    CalendarComponentComponent
  ],
})
export class ComponentsModule {}
