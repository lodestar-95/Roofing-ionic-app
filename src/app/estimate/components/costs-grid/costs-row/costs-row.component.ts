import { GeneralService } from 'src/app/estimate/calculation/materials/general.service';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NavController, PopoverController } from '@ionic/angular';
import { MaterialColor } from 'src/app/models/material-color.model';
import { MeasuresMaterialType } from 'src/app/models/measures-material-types.model';
import { PvMaterialColor } from 'src/app/models/pv_material_color.model';
import { PopoverMaterialColorsComponent } from '../../popover-material-colors/popover-material-colors.component';
import { v4 as uuidv4 } from 'uuid';
import { BidSheetCalculationService } from 'src/app/estimate/pages/bid-sheet/calculations.service';

@Component({
  selector: 'app-costs-row',
  templateUrl: './costs-row.component.html',
  styleUrls: ['./costs-row.component.scss'],
})
export class CostsRowComponent implements OnInit {
  @Input() shingleLines: any[];
  @Input() materialTypes: MeasuresMaterialType[];
  @Input() materialColors: MaterialColor[];
  @Input() building: any;
  @Input() calculations: any;
  @Input() canModifyProposal = true;
  @Input() options: any[];
  @Input() builtins: any[];
  @Input() upgrades: any[];
  @Input() idVersion: any;
  @Output() colorChanged = new EventEmitter<PvMaterialColor>();
  segment: string = 'built-in';
  alwaysAllowModification: boolean;

  constructor(private popoverCtrl: PopoverController, private nav: NavController,
    private calculationService: BidSheetCalculationService,
    private general: GeneralService ) { }

  ngOnInit() {
    this.shingleLines = JSON.parse(localStorage.getItem("shingleLines")) || this.shingleLines;
    this.getAlwaysAllowModification();
  }

  async getAlwaysAllowModification() {
    this.alwaysAllowModification = 1 == await this.general.getConstDecimalValue('always_allow_modification');
  }

  /**
   * Change segment value
   */
  segmentChanged(event: any) {
    const segmentValue = event.detail.value;
    this.segment = segmentValue;
  }

  /**
   * Show or hide segment details
   * @param id
   */
  onShowSegment(id) {
    this.segment = 'built-in';

    this.shingleLines = this.shingleLines.map((element) => {
      if (element.id == id) {
        return { ...element, show: !element.show };
      } else {
        return { ...element, show: false };
      }
    });
  }

  /**
   *
   * @param idMaterialType
   * @returns
   */
  async openPopopMaterialColors(event, item) {

    const colors = this.materialColors.filter(
      (x) => x.id_material_type == item.id_material_type
    );

    const popover = await this.popoverCtrl.create({
      component: PopoverMaterialColorsComponent,
      event: event,
      side: 'right',
      componentProps: {
        colors,
      },
    });

    await popover.present();
    const result = await popover.onWillDismiss();

    if (result.data) {

      this.shingleLines = this.shingleLines.map((element) => {
        if (element.id == item.id) {
          return { ...element, color: result.data };
        } else {
          return { ...element };
        }
      });
      console.log(result.data);
      const color: PvMaterialColor = {
        id: uuidv4(),
        id_color: result.data.id,
        id_material_type: result.data.id_material_type,
        id_version: this.idVersion,
        isModified: true
      };
      this.colorChanged.emit(color);

      localStorage.setItem("shingleLines", JSON.stringify(this.shingleLines));
    }
  }

  showBidSheet(materialType) {
    const bidSheetRoute = `/home/estimate/bid_sheet/${materialType.id_trademark}/${materialType.id}`;
    this.calculationService.setCalculations(this.calculations);
    this.nav.navigateForward(bidSheetRoute);
  }
}
