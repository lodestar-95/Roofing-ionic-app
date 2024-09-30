import { Injectable } from '@angular/core';
import { Subject, Subscription } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class EventService {
  private channels: { [key: string]: Subject<any>; } = {};
  private fooSubject = new Subject<any>();


  constructor() {

  }


  subscribe(topic: string, observer: (_: any) => void): Subscription {
    console.log('topic',topic);
    if (!this.channels[topic]) {
      console.log('topic subscribed',topic);
      // You can also use ReplaySubject with one concequence
      this.channels[topic] = new Subject<any>();
      return this.channels[topic].subscribe(observer);
    }
    if(topic=='progressBar:update'){
      return this.channels[topic].subscribe(observer);
    }
    
  }

  publish(topic: string, data?: any): void {
    console.log('this.channels',this.channels);
    console.log('this.channels published topic',topic);
    const subject = this.channels[topic];
    if (!subject) {
      // Or you can create a new subject for future subscribers
      return;
    }

    subject.next(data);
  }
  publishAll( data?: any): void {
    console.log('this.channels',this.channels);
    
    const keys = Object.keys(this.channels);
    keys.forEach(element => {
      if(element.includes('homePage') ||
      element.includes('safety-audit') ||
      element.includes('announcements') ||
      element.includes('project-details')
      ){
      const subject = this.channels[element];
      if (subject) {
        subject.next(data);
      }
    }

    
      
    });
    
  }
  destroy(topic: string): null {
    console.log('topic dest',topic);
    const subject = this.channels[topic];
    if (!subject) {
      return;
    }
    console.log('topic destroyed',topic);
    subject.complete();
    delete this.channels[topic];
  }
}
