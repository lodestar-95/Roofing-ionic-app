import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-builtin-costs-segment',
  templateUrl: './builtin-costs-segment.component.html',
  styleUrls: ['./builtin-costs-segment.component.scss'],
})
export class BuiltinCostsSegmentComponent implements OnInit {
  @Input() data: any;
  @Input() materialTypeId: number;
  @Input() total: number;
  tableData: any;

  constructor() { }

  ngOnInit() {
    this.tableData = this.data?.filter(x => x?.id_material_type_shingle == this.materialTypeId || x?.is_built_in);
  }

}
