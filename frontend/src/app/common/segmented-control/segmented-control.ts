import {Component, computed, input, model} from '@angular/core';

interface SegmentOption{
  optionNr: number;
  text: string;
}
@Component({
  imports: [],
  selector: 'segmented-control',
  styleUrl: './segmented-control.scss',
  templateUrl: './segmented-control.html',
})
export class SegmentedControl {

  readonly segments = input<string[]>([]);
  protected displaySegments = computed(() => {
    return this.segments().map((segment, index) => {
      const segmentOption: SegmentOption = {
        text: segment,
        optionNr: index
      }

      return segmentOption;
    });
  })

  readonly currentSelectedOption = model<number>(0);
}
