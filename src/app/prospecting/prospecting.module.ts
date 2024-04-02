import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ProspectingPageRoutingModule } from './prospecting-routing.module';
import { ProspectingPage } from './prospecting.page';
import { PipesModule } from '../shared/pipes/pipes.module';
import { ProspectingListComponent } from './components/prospecting-list/prospecting-list.component';
import { ProspectingItemComponent } from './components/prospecting-item/prospecting-item.component';
import { ProspectingFilterComponent } from './components/prospecting-filter/prospecting-filter.component';
import { DetailPage } from './pages/detail/detail.page';
import { BuildingComponent } from './modals/building/building.component';
import { PopoverProspectingVersionComponent } from './components/popover-prospecting-version/popover-prospecting-version.component';
import { BuildingListComponent } from './components/building-list/building-list.component';
import { ProspectingSegmentComponent } from './components/prospecting-segment/prospecting-segment.component';
import { RoofSlopesListComponent } from './components/prospecting-segment/roof-slopes-segment/roof-slopes-list.component';
import { ComponentsModule } from '../shared/components/components.module';
import { GeneralSegmentComponent } from './components/prospecting-segment/general-segment/general-segment.component';
import { ModalLayersComponent } from './components/prospecting-segment/roof-slopes-segment/modals/modal-layers/modal-layers.component';
import { OtherMeasuresSegmentComponent } from './components/prospecting-segment/other-measures-segment/other-measures-segment.component';
import { ButtonOptionComponent } from './components/prospecting-segment/other-measures-segment/components/button-option/button-option.component';
import { RidgeCapComponent } from './modals/ridge-cap/ridge-cap.component';
import { ModalRoofSlopeComponent } from './components/prospecting-segment/roof-slopes-segment/modals/modal-roof-slope/modal-roof-slope.component';
import { LayersListComponent } from './components/prospecting-segment/roof-slopes-segment/components/layers-list/layers-list.component';
import { FlatRoofComponent } from './modals/flat-roof/flat-roof.component';
import { SteepSlopeComponent } from './modals/steep-slope/steep-slope.component';
import { MiscellaneusComponent } from './modals/miscellaneus/miscellaneus.component';
import { OtherMeasuresComponent } from './components/other-measures/other-measures.component';
import { VentingComponent } from './modals/venting/venting.component';
import { LowSlopeComponent } from './modals/low-slope/low-slope.component';
import { FlashingsComponent } from './modals/flashings/flashings.component';
import { DMetalComponent } from './modals/d-metal/d-metal.component';
import { OutOfTownExpensesComponent } from './modals/out-of-town-expenses/out-of-town-expenses.component';
import { DetailsSegmentComponent } from './components/prospecting-segment/details-segment/details-segment.component';
import { AddNewOrNotRequiredComponent } from '../shared/components/add-new-or-not-required/add-new-or-not-required.component';
import { CricketsComponent } from './modals/crickets/crickets.component';
import { ButtonOptionSimpleComponent } from './components/button-option-simple/button-option-simple.component';
import { PopoverOptionsListComponent } from './components/popover-options-list/popover-options-list.component';
import { PopoverMultipleOptionsComponent } from './components/popover-multiple-options/popover-multiple-options.component';
import { AddNoteComponent } from './components/add-note/add-note.component';
import { CricketListComponent } from './components/cricket-list/cricket-list.component';
import { OptionsSegmentComponent } from './components/prospecting-segment/options-segment/options-segment.component';
import { OptionsComponent } from './modals/options/options.component';
import { OptionsListComponent } from './components/options-list/options-list.component';
import { ChimneysComponent } from './modals/chimneys/chimneys.component';
import { ChimneyListComponent } from './components/chimney-list/chimney-list.component';
import { SkylightListComponent } from './components/skylight-list/skylight-list.component';
import { SkylightsComponent } from './modals/skylights/skylights.component';
import { UpgradesSegmentComponent } from './components/prospecting-segment/upgrades-segment/upgrades-segment.component';
import { UpgradesComponent } from './modals/upgrades/upgrades.component';
import { NgxMaskModule } from 'ngx-mask';
import { SelectionSegmentComponent } from './components/prospecting-segment/selection-segment/selection-segment.component';
import { SelectionTrademarksListComponent } from './components/selection-trademarks-list/selection-trademarks-list.component';
import { MaterialCategoriesComponent } from './modals/material-categories/material-categories.component';
import { PopoverMaterialTypesComponent } from './components/popover-material-types/popover-material-types.component';
import { DeleteComponent } from './modals/delete/delete.component';
import { PopoverOptionsListSearchableComponent } from './components/popover-options-list-searchable/popover-options-list-searchable.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ProspectingPageRoutingModule,
    PipesModule,
    ReactiveFormsModule,
    ComponentsModule,
    NgxMaskModule.forRoot({
      showMaskTyped: true,
      // clearIfNotMatch : true
    }),
  ],
  declarations: [
    ProspectingPage,
    ProspectingListComponent,
    ProspectingItemComponent,
    DetailPage,
    ProspectingFilterComponent,
    BuildingComponent,
    BuildingListComponent,
    PopoverProspectingVersionComponent,
    RoofSlopesListComponent,
    ProspectingSegmentComponent,
    GeneralSegmentComponent,
    ModalRoofSlopeComponent,
    ModalLayersComponent,
    LayersListComponent,
    OtherMeasuresSegmentComponent,
    ButtonOptionComponent,
    FlatRoofComponent,
    SteepSlopeComponent,
    MiscellaneusComponent,
    RidgeCapComponent,
    VentingComponent,
    OtherMeasuresComponent,
    LowSlopeComponent,
    FlashingsComponent,
    DMetalComponent,
    OutOfTownExpensesComponent,
    DetailsSegmentComponent,
    AddNewOrNotRequiredComponent,
    CricketsComponent,
    ButtonOptionSimpleComponent,
    PopoverOptionsListComponent,
    PopoverOptionsListSearchableComponent,
    PopoverMultipleOptionsComponent,
    AddNoteComponent,
    CricketListComponent,
    OptionsSegmentComponent,
    OptionsComponent,
    OptionsListComponent,
    ChimneysComponent,
    ChimneyListComponent,
    SkylightListComponent,
    SkylightsComponent,
    UpgradesSegmentComponent,
    UpgradesComponent,
    SelectionSegmentComponent,
    SelectionTrademarksListComponent,
    MaterialCategoriesComponent,
    PopoverMaterialTypesComponent,
    DeleteComponent
  ],
  exports: [ProspectingItemComponent, PopoverProspectingVersionComponent, ButtonOptionSimpleComponent],
})
export class ProspectingPageModule {}
