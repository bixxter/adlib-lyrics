# adlib-lyrics

Synced lyrics inside Claude Code. Whatever is playing in Apple Music or Spotify shows up right above your prompt, word by word, with a tiny mascot dancing on the beat.

```
⠀⡔⣪⣭⣭⣕⢢⠀   the build is green, the coffee's warm
⣸⣿⣏⣻⣏⣻⣿⡇   one more commit before the storm
⠈⠙⢿⠮⠵⡿⠓⠄   and the agent hums along
```

A free [Claude Code mod](https://claude.dev/blog/getting-started-with-claude-code-mods/) from the maker of **[Adlib](https://tryadlib.web.app)**, the synced-lyrics overlay for Mac. The mascot is Adlib's: in the app it dances when a song has no lyrics, and here it dances all the time.

## Install

In Claude Code:

```
/plugin marketplace add bixxter/adlib-lyrics
/plugin install adlib-lyrics@adlib-lyrics
/reload-plugins
```

Needs macOS and a Claude Code with mods (built and tested on 2.1.287). The first time a song plays, macOS asks whether your terminal may control Music or Spotify. Allow it, or nothing shows.

## Settings

Two rows in `/config` (or `/plugin configure adlib-lyrics@adlib-lyrics`). A change applies at once.

| Setting | Choices |
| --- | --- |
| **Lyrics** | `stack`: the line before, the line being sung and the next one (default) · `line`: only the line being sung · `off`: no lyrics |
| **Dancing mascot** | on (default) / off. Terminal only: the desktop app's Code tab gets the lyrics alone. |

## How it works

- Once a second it asks Music and Spotify what is playing, through `osascript` (Apple Events). It never launches either app, and it checks every 3 s while nothing plays.
- The lyrics come from [LRCLIB](https://lrclib.net), a free, community-synced lyrics database. The song's title and artist go to lrclib.net, and nothing else leaves your Mac.
- LRCLIB times lines, not words, so each word lights up at a pace spread by its length.
- The mascot is Adlib's 16×12 pixel sprite drawn in braille dots, 8×3 characters.
- The first time it finds lyrics it shows one note about Adlib. That happens once ever.

## Develop

```sh
git clone https://github.com/bixxter/adlib-lyrics
claude --plugin-dir ./adlib-lyrics      # loads it for that session, reloading on save
claude plugin test ./adlib-lyrics       # the tests
claude plugin validate ./adlib-lyrics
```

## Credits

- Made by [bixxter](https://github.com/bixxter), the maker of [Adlib](https://tryadlib.web.app). Adlib puts the same word-by-word lyrics on your Mac's desktop, with a blur-focus look and the album art behind them.
- Lyrics by [LRCLIB](https://lrclib.net).

## License

MIT for the code. The Adlib name and mascot artwork are not covered by it; see [LICENSE](LICENSE).
