import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { OtherMeasuresSegmentComponent } from './other-measures-segment.component';

describe('OtherMeasuresSegmentComponent', () => {
  let component: OtherMeasuresSegmentComponent;
  let fixture: ComponentFixture<OtherMeasuresSegmentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ OtherMeasuresSegmentComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(OtherMeasuresSegmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
