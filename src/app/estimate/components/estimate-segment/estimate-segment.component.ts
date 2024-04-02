import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-estimate-segment',
  templateUrl: './estimate-segment.component.html',
  styleUrls: ['./estimate-segment.component.scss'],
})
export class EstimateSegmentComponent implements OnInit {
  @Input() segment: string;

  constructor() { }

  ngOnInit() {}

  /**
   * Change segment value
   */
   segmentChanged(event: any) {
    const segmentValue = event.detail.value;
    this.segment = segmentValue;
  }
}
