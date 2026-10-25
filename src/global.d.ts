import type {Game,Battle} from './domain';
declare global {
  interface Window {
    __lantern:()=>{game:Game;battle:Battle|null;panel:string|null;busy:boolean;metrics:{frames:number;frameMs:number[];meanMs:number;p95Ms:number;renderer:string;gpu:string;resolution:number;viewport:{width:number;height:number};moving:boolean}};
  }
}
export {};
