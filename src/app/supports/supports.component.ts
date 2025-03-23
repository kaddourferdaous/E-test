import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-support',
  templateUrl: './supports.component.html',
  styleUrls: ['./supports.component.css']
})
export class SupportsComponent implements OnInit {
  videoUrl: string = '';

  ngOnInit(): void {
    this.videoUrl = 'http://localhost:5000/supp/supports/video/v2.mp4'; 
  }
}
