import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { PopoverBidSheetBuildingComponent } from './popover-bid-sheet-building.component';

describe('PopoverBidSheetBuildingComponent', () => {
  let component: PopoverBidSheetBuildingComponent;
  let fixture: ComponentFixture<PopoverBidSheetBuildingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PopoverBidSheetBuildingComponent],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(PopoverBidSheetBuildingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
