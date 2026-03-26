# @ambrosia/config

Type-safe environment configuration for the Ambrosia framework with schema validation and DI integration.

## Installation

```bash
bun add @ambrosia/config
```

## Usage

```typescript
import { ConfigPack, ConfigService } from "@ambrosia/config";

const AppPack = definePack({
  imports: [ConfigPack],
  providers: [AppService],
});

@Injectable()
class AppService {
  constructor(private config: ConfigService) {}

  getPort() {
    return this.config.get("PORT", 3000);
  }
}
```

## Documentation

Full documentation at [ambrosia.dev/docs/config](https://ambrosia.dev/en/docs/config).

## License

MIT
