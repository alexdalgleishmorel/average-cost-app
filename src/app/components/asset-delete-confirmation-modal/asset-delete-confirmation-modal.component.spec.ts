import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AssetDeleteConfirmationModalComponent } from './asset-delete-confirmation-modal.component';

describe('AssetDeleteConfirmationModalComponent', () => {
  let component: AssetDeleteConfirmationModalComponent;
  let fixture: ComponentFixture<AssetDeleteConfirmationModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AssetDeleteConfirmationModalComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(AssetDeleteConfirmationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
