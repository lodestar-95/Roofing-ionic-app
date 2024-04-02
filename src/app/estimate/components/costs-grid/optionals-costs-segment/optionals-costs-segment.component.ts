import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-optionals-costs-segment',
  templateUrl: './optionals-costs-segment.component.html',
  styleUrls: ['./optionals-costs-segment.component.scss'],
})
export class OptionalsCostsSegmentComponent implements OnInit {
  @Input() data: any;
  @Input() materialTypeId: any;
  @Input() total: number;
  tableData: any;

  constructor() { }

  ngOnInit() {
    this.tableData = this.data?.filter(x => x.id_material_type_shingle == this.materialTypeId && x.is_built_in == false);
  }

}
