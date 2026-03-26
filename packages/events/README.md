# @ambrosia-unce/events

High-performance event bus for the Ambrosia DI framework with decorator-driven event handling.

## Installation

```bash
bun add @ambrosia-unce/events
```

## Usage

```typescript
import { EventBus, OnEvent } from "@ambrosia-unce/events";

class UserCreatedEvent {
  constructor(public readonly userId: string) {}
}

@Injectable()
class NotificationService {
  @OnEvent(UserCreatedEvent)
  handleUserCreated(event: UserCreatedEvent) {
    console.log(`Welcome email for user ${event.userId}`);
  }
}

// Emit from anywhere via DI
eventBus.emit(new UserCreatedEvent("123"));
```

## Documentation

Full documentation at [ambrosia.dev/docs/events](https://ambrosia.dev/en/docs/events).

## License

MIT
