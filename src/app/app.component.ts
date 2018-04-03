import { Component, ViewChild } from '@angular/core';
import { Settings, SettingsService } from '@helgoland/core';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { TranslateService } from '@ngx-translate/core';
import { NavController, Platform } from 'ionic-angular';

import { DiagramPage } from '../pages/diagram/diagram';
import { MapPage } from '../pages/map/map';
import { StartPage } from '../pages/start/start';
import { IrcelineSettings, IrcelineSettingsProvider } from '../providers/irceline-settings/irceline-settings';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild('content') nav: NavController;

  public rootPage: any = StartPage;

  public pages: Array<{ title: string, component: any }>;

  public lastupdate: Date;

  constructor(
    private platform: Platform,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    private settingsSrvc: SettingsService<Settings>,
    private translate: TranslateService,
    private ircelineSettings: IrcelineSettingsProvider
  ) {
    this.initializeApp();

    this.ircelineSettings.getSettings().subscribe((settings: IrcelineSettings) => this.lastupdate = settings.lastupdate);

    // used for an example of ngFor and navigation
    this.pages = [
      { title: 'map.header', component: MapPage },
      { title: 'diagram.header', component: DiagramPage }
    ];

  }

  initializeApp() {
    const langCode = navigator.language.split('-')[0];
    const language = this.settingsSrvc.getSettings().languages.find(lang => lang.code === langCode);
    if (language) {
      this.translate.use(language.code)
    } else {
      this.translate.use('en');
    }

    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  openPage(page) {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    if (this.nav.getActive().name != page.component.name) {
      this.nav.push(page.component);
    }
  }
}
