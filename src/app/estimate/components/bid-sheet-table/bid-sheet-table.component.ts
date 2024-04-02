import { Component, Input, OnInit } from '@angular/core';
import { Table } from '../../models/bid-sheet.model';

@Component({
  selector: 'app-bid-sheet-table',
  templateUrl: './bid-sheet-table.component.html',
  styleUrls: ['./bid-sheet-table.component.scss'],
})
export class BidSheetTableComponent implements OnInit {
  @Input() tableData: Table;
  @Input() showHeaders: boolean;

  constructor() { }

  ngOnInit() {
  }
}
