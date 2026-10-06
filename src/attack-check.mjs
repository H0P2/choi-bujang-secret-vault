// The student changes this check as each stage adds an attack to the same app.
// Never return tokens, private keys, real names, or note bodies.

function getApp(config) {
  let app;

  try {
    app = new URL(config.publicAppUrl);
  } catch {
    throw new Error(
      'aleph.config.json의 실제 배포 주소를 먼저 넣어 주세요.',
    );
  }

  if (
    app.protocol !== 'https:'
    || app.username
    || app.password
    || app.search
    || app.hash
    || app.pathname !== '/'
    || app.hostname.endsWith('.example')
  ) {
    throw new Error(
      'aleph.config.json의 실제 배포 주소를 먼저 넣어 주세요.',
    );
  }

  return app;
}

async function checkStep1(config) {
  const app = getApp(config);

  const response = await fetch(new URL('/data.json', app), {
    redirect: 'error',
    signal: AbortSignal.timeout(10000),
  });

  let visible = false;

  if (response.ok) {
    try {
      const data = await response.json();

      visible =
        data?.sampleMarker === config.sampleMarker
        && Array.isArray(data.notes)
        && data.notes.length > 0;
    } catch {
      // Non-JSON response is a failed check.
    }
  }

  return [
    {
      attackId: 'anonymous_note_read',
      expected: '비로그인 화면에서 가상 메모를 확인',
      observed: visible
        ? '비로그인 요청에서 공개 가상 메모 확인 표시가 보임'
        : `비로그인 요청에서 확인 표시가 보이지 않음 (HTTP ${response.status})`,
    },
  ];
}

async function checkStep2(config) {
  const app = getApp(config);

  const staticResponse = await fetch(new URL('/data.json', app), {
    redirect: 'error',
    signal: AbortSignal.timeout(10000),
  });

  let staticCleared = false;

  if (staticResponse.ok) {
    try {
      const data = await staticResponse.json();

      staticCleared =
        Array.isArray(data?.notes)
        && data.notes.length === 0;
    } catch {
      // Non-JSON response is not the expected static result.
    }
  }

  const apiResponse = await fetch(new URL('/api/notes', app), {
    redirect: 'error',
    signal: AbortSignal.timeout(10000),
  });

  let anonymousApiVisible = false;
  let count = 0;

  if (apiResponse.ok) {
    try {
      const data = await apiResponse.json();

      if (Array.isArray(data?.notes)) {
        count = data.notes.length;
        anonymousApiVisible = count > 0;
      }
    } catch {
      // Non-JSON response is a failed API check.
    }
  }

  return [
    {
      attackId: 'static_note_removed',
      expected: '현재 정적 data.json에는 가상 메모가 없어야 함',
      observed: staticCleared
        ? '현재 정적 data.json의 notes가 비어 있음'
        : `현재 정적 data.json이 비어 있지 않거나 확인할 수 없음 (HTTP ${staticResponse.status})`,
    },
    {
      attackId: 'anonymous_server_api_read',
      expected: '2단계에서는 공개 서버 API 약점이 아직 남아 있음',
      observed: anonymousApiVisible
        ? `비로그인 서버 API 요청에서 가상 자료 ${count}건이 반환됨`
        : `비로그인 서버 API에서 자료를 확인하지 못함 (HTTP ${apiResponse.status})`,
    },
  ];
}

export async function runAttackChecks(config) {
  if (config.step === 1) {
    return checkStep1(config);
  }

  if (config.step === 2) {
    return checkStep2(config);
  }

  throw new Error(
    '이 단계의 공격 점검을 src/attack-check.mjs에 구현해 주세요.',
  );
}
