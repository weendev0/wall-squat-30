import { EnvironmentProviders, Provider } from '@angular/core';
import {
  FakeClock,
  FakeScreenWakeLock,
  FakeSoundPlayer,
  InMemoryAttemptRepository,
  InMemoryChallengeRepository,
  SequentialIdGenerator,
} from '../../application/testing/fakes';
import {
  ATTEMPT_REPOSITORY,
  CHALLENGE_REPOSITORY,
  CLOCK,
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
    clock: new FakeClock(today),
    ids: new SequentialIdGenerator(),
    sound: new FakeSoundPlayer(),
    wakeLock: new FakeScreenWakeLock(),
  };

  const providers: (Provider | EnvironmentProviders)[] = [
    provideWallSquat(),
    { provide: CHALLENGE_REPOSITORY, useValue: fakes.challenges },
    { provide: ATTEMPT_REPOSITORY, useValue: fakes.attempts },
    { provide: CLOCK, useValue: fakes.clock },
    { provide: ID_GENERATOR, useValue: fakes.ids },
    { provide: SOUND_PLAYER, useValue: fakes.sound },
    { provide: SCREEN_WAKE_LOCK, useValue: fakes.wakeLock },
  ];

  return { providers, fakes };
}
