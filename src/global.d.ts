import type {Game,Battle} from './domain';
declare global {
  interface Window {
    __lantern:()=>{game:Game;battle:Battle|null;panel:string|null;busy:boolean;metrics:{frames:number;frameMs:number[];meanMs:number;p95Ms:number;renderer:string;gpu:string;textures:number;decodedTextureBytes:number;resolution:number;viewport:{width:number;height:number};heroScreen:{x:number;y:number};moving:boolean}};
  }
}
export {};
