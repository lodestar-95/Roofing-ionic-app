import { Component, OnInit } from '@angular/core';
import { MessageResetPasswordService } from '../../services/message-reset-password.service';

@Component({
  selector: 'app-message',
  templateUrl: './message.page.html',
  styleUrls: ['./message.page.scss'],
})
/**
 * @author: Carlos Rodríguez
 */
export class MessagePage implements OnInit {
  sliderOpts = {
    allowSlidePrev: false,
    allowSlideNext: false,
  };

  constructor(public message: MessageResetPasswordService) {}

  ngOnInit() {
    console.log(this.message.title);
  }
}
