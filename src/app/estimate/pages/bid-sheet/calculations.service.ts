import { Injectable } from "@angular/core";
import { BehaviorSubject, ReplaySubject } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class BidSheetCalculationService{
    public calculationSubject = new ReplaySubject<any>(1);

    setCalculations(calculations: any){
        this.calculationSubject.next(calculations);
    }
}