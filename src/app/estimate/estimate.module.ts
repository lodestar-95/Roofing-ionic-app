import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { EstimatePageRoutingModule } from './estimate-routing.module';
import { EstimatePage } from './estimate.page';
import { EstimateSegmentComponent } from './components/estimate-segment/estimate-segment.component';
import { ComponentsModule } from '../shared/components/components.module';
import { UpgradesSegmentComponent } from './components/estimate-segment/upgrades-segment/upgrades-segment.component';
import { OptionsSegmentComponent } from './components/estimate-segment/options-segment/options-segment.component';
import { PopoverBuildingsComponent } from './components/popover-buildings/popover-buildings.component';
import { OptionsRadioButtonsComponent } from './components/options-radio-buttons/options-radio-buttons.component';
import { UpgradesRadioButtonsComponent } from './components/upgrades-radio-buttons/upgrades-radio-buttons.component';
import { ShingleLinesSegmentComponent } from './components/estimate-segment/shingle-lines-segment/shingle-lines-segment.component';
import { SingleLinesCheckboxComponent } from './components/single-lines-checkbox/single-lines-checkbox.component';
import { CostsSegmentComponent } from './components/estimate-segment/costs-segment/costs-segment.component';
import { CostsGridComponent } from './components/costs-grid/costs-grid.component';
import { CostsRowComponent } from './components/costs-grid/costs-row/costs-row.component';
import { BuiltinCostsSegmentComponent } from './components/costs-grid/builtin-costs-segment/builtin-costs-segment.component';
import { UpgradesCostsSegmentComponent } from './components/costs-grid/upgrades-costs-segment/upgrades-costs-segment.component';
import { OptionalsCostsSegmentComponent } from './components/costs-grid/optionals-costs-segment/optionals-costs-segment.component';
import { FilterCostsComponent } from './components/costs-grid/filter-costs/filter-costs.component';
import { CostsColorsComponent } from './components/costs-colors/costs-colors.component';
import { PriceModalComponent } from './modals/price-modal/price-modal.component';
import { RowSegmentComponent } from './components/costs-grid/row-segment/row-segment.component';
import { PopoverMaterialColorsComponent } from './components/popover-material-colors/popover-material-colors.component';
import { PopoverGroupColorsComponent } from './components/popover-group-colors/popover-group-colors.component';
import { BidSheetPageModule } from './pages/bid-sheet/bid-sheet.module';

@NgModule({
  declarations: [
    EstimatePage,
    OptionsRadioButtonsComponent,
    EstimateSegmentComponent,
    UpgradesSegmentComponent,
    OptionsSegmentComponent,
    PopoverBuildingsComponent,
    UpgradesRadioButtonsComponent,
    ShingleLinesSegmentComponent,
    SingleLinesCheckboxComponent,
    CostsSegmentComponent,
    CostsGridComponent,
    CostsRowComponent,
    BuiltinCostsSegmentComponent,
    UpgradesCostsSegmentComponent,
    OptionalsCostsSegmentComponent,
    FilterCostsComponent,
    CostsColorsComponent,
    PriceModalComponent,
    RowSegmentComponent,
    PopoverMaterialColorsComponent,
    PopoverGroupColorsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EstimatePageRoutingModule,
    ComponentsModule,
    ComponentsModule,
    BidSheetPageModule
  ],
})
export class EstimatePageModule {}
