import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-upgrades-costs-segment',
  templateUrl: './upgrades-costs-segment.component.html',
  styleUrls: ['./upgrades-costs-segment.component.scss'],
})
export class UpgradesCostsSegmentComponent implements OnInit {
  @Input() data: any;
  @Input() materialTypeId: any;
  @Input() total: number;
  tableData: any;

  constructor() { }

  ngOnInit() {
    this.tableData = this.data?.filter(x => x.id_material_type_shingle == this.materialTypeId);
  }

}
