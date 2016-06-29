import {Component, ContentChildren, ElementRef, Input, QueryList, ViewChildren} from "@angular/core";
import {animate, state, style, trigger, transition} from '@angular/core';
import {App, AlertController, Animation, NavController} from 'ionic-angular';

import {EmailDataProvider, Email} from "./email-data-provider";
import {InboxItemWrapper} from "./inbox-item-wrapper";

import {SnoozeViewController} from '../snooze/snooze-view-controller';

@Component({
  selector: 'unread-inbox',
  directives: [InboxItemWrapper],
  template: `
  <div>Re-order enabled is: {{reorderEnabled}}</div>
  <ion-list reorder="reorder">
    <inbox-item-wrapper #instance
      *ngFor="let email of emails; let i = index"
      (click)="favorite(email)"
      leftIconShort="checkmark"
      leftIconLong="close"
      rightIconShort="time"
      rightIconLong="menu"
      [overrideRightShortSwipeTransition]="overrideAnimation"
      (leftShortSwipe)="archive(i)"
      (leftLongSwipe)="delete(i)"
      (rightShortSwipe)="snooze(i)"
      (rightLongSwipe)="somethingElse(i)"
    >
      <button ion-item detail-none >
        <ion-icon ios="ios-star-outline" md="ios-star-outline" item-left *ngIf="!email.favorited" primary></ion-icon>
        <ion-icon class="yellow" ios="ios-star" md="ios-star" item-left *ngIf="email.favorited"></ion-icon>
        <p>{{email.sender}}</p>
        <h2>{{email.subject}}</h2>
        <p>{{email.body}}</p>
      </button>
    </inbox-item-wrapper>
  </ion-list>
  `
})
export class UnreadInbox{

  @Input() reorder: boolean = false;
  @ViewChildren('instance', {read: ElementRef}) itemWrappers: QueryList<ElementRef>;

  private emails: Email[];

  constructor(private alertController: AlertController, private app: App, private emailDataProvider: EmailDataProvider, private nav: NavController){
    this.loadUnreadEmails();
  }

  ngOnChanges(something){
    console.log("Something: ", something);
  }

  loadUnreadEmails(){
    this.emails = this.emailDataProvider.getUnreadEmails();
  }

  favorite(email:any){
    email.favorited = !email.favorited;
  }

  archive(index: number){
    this.animateItemWrapperOut(index, () => {
      this.emailDataProvider.archiveEmail(this.emails[index]);
      this.loadUnreadEmails();
    });
  }

  delete(index: number){
    this.animateItemWrapperOut(index, () => {
      this.emailDataProvider.deleteEmail(this.emails[index]);
      this.loadUnreadEmails();
    });
  }

  snooze(index: number){
    let snoozeView = SnoozeViewController.create();
    snoozeView.onDismiss((data) => {
      this.animateItemWrapperOut(index, () => {
        this.emailDataProvider.snoozeEmail(this.emails[index], data.snoozedUntilDate);
        this.loadUnreadEmails();
      });
    });
    snoozeView.present(snoozeView);
  }

  somethingElse(index: number){
    let alert = this.alertController.create({
      title: 'Some Action',
      subTitle: `w00t! You've taken an action! Try some other swipes!`,
      buttons: ['OK']
    });
    alert.present();
  }

  overrideAnimation(elementRef: ElementRef, currentPosition: number, originalNewPosition: number, maximumAchievedVelocity: number, minSuggestedVelocity: number): Animation{
    let velocity = Math.max(Math.abs(maximumAchievedVelocity), minSuggestedVelocity);
    let transitionTimeInMillis = Math.abs(Math.floor(currentPosition/velocity));
    let animation = new Animation(elementRef,  {renderDelay: 0});
    animation.fromTo('translateX', `${currentPosition}px`, `${0}px`);
    animation.before.addClass("short");
    animation.before.removeClass("disabled");
    animation.before.removeClass("long");
    animation.duration(transitionTimeInMillis);
    return animation;
  }

  animateItemWrapperOut(index: number, callback: () => any):void {
    let array = this.itemWrappers.toArray();
    let animation = new Animation(array[index].nativeElement, {renderDelay: 0});

    animation.fromTo('height', `${array[index].nativeElement.clientHeight}px`, `${0}px`);
    animation.easing('ease-in');
    animation.duration(DELETE_ANIMATION_DURATION);
    animation.onFinish(callback);
    animation.play();
  }
}

const DELETE_ANIMATION_DURATION = 100;
