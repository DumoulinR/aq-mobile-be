import {Moment} from 'moment';

export enum BelAirColor {
    Red = 'red',
    Green = 'green',
    Blue = 'blue',
}

// found from user-location-list.service.ts
export interface UserLocation {
    id?: number;
    label?: string;
    type: 'user' | 'current';
    isCurrentVisible?: boolean;
    date?: Date;
    longitude?: number;
    latitude?: number;
    postalCode?: string;
    order?: number;
}

export interface IBarChartData {
    data: IBarChartDataItem[];
    labels: string[];
}

export interface IBarChartDataItem {
    value: number;
    background: string;
}


export interface Substance {
    name: string;
    abbreviation: string;
    unit: string;
}

export interface DataPoint {
    location: UserLocation;
    substance: Substance;
    currentValue: number;
    averageValue: number;

    // todo -> thresholds
    // are thresholds set on server side or defined in client?
    // how are the colors determinded for these thresholds?
    // for now, taking random values
    evaluation: string;
    color: string;
}

export interface DataPointForDay extends DataPoint {
    day: Moment;
}

export interface LongTermDataPoint extends DataPoint {
    euBenchMark: number;
    worldBenchMark: number;
    historicalValues: HistoricalValue[];
    chartData?: ChartData;
}

export interface ChartData {
    labels: string[];
    data: Array<{
        value: number;
        background: string;
    }>;
    max: number;
}

export interface HistoricalValue {
   value: number;
   year:  number;
   evaluationColor: string;
}

