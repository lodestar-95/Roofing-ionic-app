import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { OptionalsCostsSegmentComponent } from './optionals-costs-segment.component';

describe('OptionalsCostsSegmentComponent', () => {
  let component: OptionalsCostsSegmentComponent;
  let fixture: ComponentFixture<OptionalsCostsSegmentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ OptionalsCostsSegmentComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(OptionalsCostsSegmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
