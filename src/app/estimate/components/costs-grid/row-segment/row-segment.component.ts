import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-row-segment',
  templateUrl: './row-segment.component.html',
  styleUrls: ['./row-segment.component.scss'],
})
export class RowSegmentComponent implements OnInit {
    showSegment:boolean;
    segment:string;
  constructor() {}

  ngOnInit() {}

  segmentChanged(event: any){

  }
}
