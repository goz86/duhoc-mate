import { describe, expect, it } from 'vitest';
import { getStudyVideoPreviewPlayback } from './studyVideoPreview';

describe('study video preview playback', () => {
  it('mutes previews so remote camera streams can autoplay', () => {
    expect(getStudyVideoPreviewPlayback().muted).toBe(true);
  });

  it('keeps previews inline on mobile browsers', () => {
    expect(getStudyVideoPreviewPlayback().playsInline).toBe(true);
  });
});
