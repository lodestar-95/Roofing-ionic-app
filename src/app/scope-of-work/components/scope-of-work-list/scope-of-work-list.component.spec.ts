import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ScopeOfWorkListComponent } from './scope-of-work-list.component';

describe('ScopeOfWorkListComponent', () => {
  let component: ScopeOfWorkListComponent;
  let fixture: ComponentFixture<ScopeOfWorkListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ScopeOfWorkListComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ScopeOfWorkListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
