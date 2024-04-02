import { Injectable } from '@angular/core';


@Injectable({
    providedIn: 'root',
})

export class HashCodeService {
    constructor() { }

    public getHashCode(text: string) {
        let hash = 0;
        if (text.length == 0) {
            return hash;
        }
        for (let i = 0; i < text.length; i++) {
            let ch = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + ch;
            hash = hash & hash;
        }
        return hash;
    }
}
