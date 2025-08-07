describe('LiveKit room', () => {
  it('connects two users', () => {
    cy.intercept('POST', '/api/rooms/create', {
      room_id: 'room1',
      room_url: '/?room=room1'
    });
    cy.intercept('GET', '/config*', { use_livekit: false });
    cy.intercept('POST', '/livekit/token', { token: 'fake', url: 'wss://fake' });

    cy.visit('/', {
      onBeforeLoad(win) {
        class FakeWebSocket {
          constructor() {
            setTimeout(() => this.onopen && this.onopen(), 10);
            const msgs = [
              { type: 'joined', user_id: 'u1' },
              { type: 'users_update', users: [{ id: 'u1', name: 'Alice' }] },
              { type: 'users_update', users: [{ id: 'u1', name: 'Alice' }, { id: 'u2', name: 'Bob' }] }
            ];
            msgs.forEach((m, i) =>
              setTimeout(() => this.onmessage && this.onmessage({ data: JSON.stringify(m) }), 20 * (i + 1))
            );
          }
          send() {}
          close() {}
        }
        win.WebSocket = FakeWebSocket;
      }
    });

    cy.contains('Войти как гость').click();
    cy.contains('Создать комнату').click();
    cy.get('button:has(svg[data-testid="MenuIcon"])').click();
    cy.contains('Alice');
    cy.contains('Bob');
  });
});
