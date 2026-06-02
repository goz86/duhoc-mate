import { describe, expect, it } from 'vitest';
import { getStudyVideoPreviewPlayback } from './studyVideoPreview';

describe('study video preview playback', () => {
  it('mutes every preview so remote camera streams can autoplay', () => {
    expect(getStudyVideoPreviewPlayback().muted).toBe(true);
  });

  it('keeps previews inline for mobile layouts', () => {
    expect(getStudyVideoPreviewPlayback().playsInline).toBe(true);
  });
});
