import { versionBump } from 'bumpp'

async function main() {
  const release = process.env.RELEASE_VERSION || process.env.RELEASE_TYPE

  console.log('Bumping version in package.json\n')

  await versionBump({
    files: ['package.json'],
    release,
    commit: true,
    tag: false,
    push: false,
    printCommits: false,
    confirm: !release,
  })
}

main().catch((error) => {
  console.error('Error during version bump:', error)
  process.exit(1)
})
