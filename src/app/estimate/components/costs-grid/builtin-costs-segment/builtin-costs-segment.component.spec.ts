import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { BuiltinCostsSegmentComponent } from './builtin-costs-segment.component';

describe('BuiltinCostsSegmentComponent', () => {
  let component: BuiltinCostsSegmentComponent;
  let fixture: ComponentFixture<BuiltinCostsSegmentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BuiltinCostsSegmentComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(BuiltinCostsSegmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
