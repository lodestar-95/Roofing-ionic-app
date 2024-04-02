import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ShingleLinesSegmentComponent } from './shingle-lines-segment.component';

describe('ShingleLinesSegmentComponent', () => {
  let component: ShingleLinesSegmentComponent;
  let fixture: ComponentFixture<ShingleLinesSegmentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ShingleLinesSegmentComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ShingleLinesSegmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
