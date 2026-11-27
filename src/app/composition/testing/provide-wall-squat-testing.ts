import { EnvironmentProviders, Provider } from '@angular/core';
import {
  FakeClock,
  FakeFileSharer,
  FakeScreenWakeLock,
  FakeSoundPlayer,
  InMemoryAttemptRepository,
  InMemoryChallengeRepository,
  InMemoryCheckInRepository,
  SequentialIdGenerator,
} from '../../application/testing/fakes';
import {
  ATTEMPT_REPOSITORY,
  CHALLENGE_REPOSITORY,
  CHECK_IN_REPOSITORY,
  CLOCK,
  FILE_SHARER,
  ID_GENERATOR,
  provideWallSquat,
  SCREEN_WAKE_LOCK,
  SOUND_PLAYER,
} from '../provide-wall-squat';

/**
 * The real composition root with every port swapped for a fake.
 * Screen tests use it so they run fast, without IndexedDB, sound or a real clock.
 * Keep the returned fakes to set up data or check what happened.
 */
export function provideWallSquatTesting(today = '2026-11-16') {
  const fakes = {
    challenges: new InMemoryChallengeRepository(),
    attempts: new InMemoryAttemptRepository(),
    checkIns: new InMemoryCheckInRepository(),
    clock: new FakeClock(today),
    ids: new SequentialIdGenerator(),
    sound: new FakeSoundPlayer(),
    wakeLock: new FakeScreenWakeLock(),
    fileSharer: new FakeFileSharer(),
  };

  const providers: (Provider | EnvironmentProviders)[] = [
    provideWallSquat(),
    { provide: CHALLENGE_REPOSITORY, useValue: fakes.challenges },
    { provide: ATTEMPT_REPOSITORY, useValue: fakes.attempts },
    { provide: CHECK_IN_REPOSITORY, useValue: fakes.checkIns },
    { provide: CLOCK, useValue: fakes.clock },
    { provide: ID_GENERATOR, useValue: fakes.ids },
    { provide: SOUND_PLAYER, useValue: fakes.sound },
    { provide: SCREEN_WAKE_LOCK, useValue: fakes.wakeLock },
    { provide: FILE_SHARER, useValue: fakes.fileSharer },
  ];

  return { providers, fakes };
}
