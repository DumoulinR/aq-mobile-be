import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

import { UserNotificationSetting } from '../../components/user-notification-settings/user-notification-settings.component';
import { UserLocation } from '../../Interfaces';
import { UserSettingsService } from '../../services/user-settings.service';

@Component({
    selector: 'app-intro-screen',
    templateUrl: './onboarding-screen.component.html',
    styleUrls: ['./onboarding-screen.component.scss'],
})
export class OnboardingScreenComponent implements OnInit {

    // implementation task, fetch this from device settings
    btnText = 'Ga verder';
    sliderDisabled = false;

    userNotificationSettings: UserNotificationSetting[] = [];

    constructor(
        private navCtrl: NavController,
        private userSettingsService: UserSettingsService
    ) {
        this.userNotificationSettings = userSettingsService.getUserNotificationSettings();
    }

    ngOnInit() { }

    updateUserLocationSettings(userLocation: UserLocation) {
        // implementation task
        console.log('todo: implement update user location settings');
        console.log(userLocation);
    }

    updateUserNotificationSettings(updatedSetting: UserNotificationSetting) {
        this.userSettingsService.updateUserNotificationSettings(updatedSetting);
    }

    onboardingComplete() {
        // implementation task
        console.log('todo: implement user completed onboarding');

        this.navCtrl.navigateForward('main');
    }

    getFocus(event: boolean) {
        this.sliderDisabled = event;
    }

    loseFocus(event: boolean) {
        this.sliderDisabled = event;
    }
}
