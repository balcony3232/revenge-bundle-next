import { useState } from 'react'
import { ScrollView, View, Text, TextInput, Pressable, Image } from 'react-native'
import { clientProfileOverrides } from '~/nexcord/plugins/profile-overrides'
import type { ProfileAppearance } from '~/nexcord/plugins/profile-editor'

const panel = { backgroundColor: '#292930', borderRadius: 14, padding: 14, marginBottom: 12 } as const
const field = { backgroundColor: '#1d1d23', color: '#fff', borderRadius: 9, padding: 12, marginTop: 6 } as const
const caption = { color: '#bbb', fontSize: 13 } as const

export default function NexcordProfileEditorScreen() {
  const [userId, setUserId] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [badgeIds, setBadgeIds] = useState('')
  const [effectId, setEffectId] = useState('')
  const [accent, setAccent] = useState('#7162DA')
  const [status, setStatus] = useState('Enter a Discord user ID and choose your local appearance.')
  const [preview, setPreview] = useState<ProfileAppearance>({})

  const save = () => {
    try {
      const appearance: ProfileAppearance = {
        ...(username.trim() ? { username: username.trim() } : {}),
        ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
        ...(bio.trim() ? { bio } : {}),
        ...(avatarUrl.trim() ? { avatarUrl: avatarUrl.trim() } : {}),
        ...(bannerUrl.trim() ? { bannerUrl: bannerUrl.trim() } : {}),
        ...(badgeIds.trim() ? { badgeIds: badgeIds.split(',').map(x => x.trim()).filter(Boolean) } : {}),
        ...(effectId.trim() ? { effectId: effectId.trim() } : {}),
        ...( /^#[0-9a-fA-F]{6}$/.test(accent) ? { accentColor: Number.parseInt(accent.slice(1), 16) } : {}),
      }
      clientProfileOverrides.set(userId.trim(), appearance)
      setPreview(appearance)
      setStatus('Saved in this session. Discord-wide rendering and persistent storage are not yet connected.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not save appearance')
    }
  }

  const input = (label: string, value: string, onChangeText: (text: string) => void, placeholder: string, multiline = false) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={caption}>{label}</Text>
      <TextInput style={field} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#888" multiline={multiline} autoCapitalize="none" />
    </View>
  )

  return <ScrollView style={{ flex: 1, backgroundColor: '#202027' }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
    <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 6 }}>Nexcord Profile Editor</Text>
    <Text style={{ color: '#bbb', marginBottom: 18 }}>Free local-only customisation. No Discord account changes.</Text>
    <View style={panel}>
      {preview.bannerUrl ? <Image source={{ uri: preview.bannerUrl }} style={{ height: 92, borderRadius: 8, marginBottom: 8 }} /> : <View style={{ height: 54, backgroundColor: accent, borderRadius: 8, marginBottom: 8 }} />}
      {preview.avatarUrl ? <Image source={{ uri: preview.avatarUrl }} style={{ width: 64, height: 64, borderRadius: 32 }} /> : null}
      <Text style={{ color: '#fff', fontSize: 19, fontWeight: '700' }}>{preview.displayName || displayName || 'Display name'}</Text>
      <Text style={caption}>@{preview.username || username || 'username'}</Text>
      <Text style={{ color: '#ddd', marginTop: 8 }}>{preview.bio || bio || 'Your local bio preview'}</Text>
      <Text style={{ color: '#a99cf8', marginTop: 8 }}>{(preview.badgeIds || []).join(' · ')}</Text>
    </View>
    <View style={panel}>
      {input('Discord user ID (self or another user)', userId, setUserId, '123456789012345678')}
      {input('Username', username, setUsername, 'Custom username')}
      {input('Display name', displayName, setDisplayName, 'Custom display name')}
      {input('Bio', bio, setBio, 'Custom bio', true)}
      {input('Avatar image URL (HTTPS)', avatarUrl, setAvatarUrl, 'https://...')}
      {input('Banner image URL (HTTPS)', bannerUrl, setBannerUrl, 'https://...')}
      {input('Badge IDs (comma separated)', badgeIds, setBadgeIds, 'badge-one, badge-two')}
      {input('Profile effect ID', effectId, setEffectId, 'effect-id')}
      {input('Accent colour', accent, setAccent, '#7162DA')}
      <Pressable onPress={save} style={{ backgroundColor: '#7162DA', padding: 14, borderRadius: 10, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Save local appearance</Text>
      </Pressable>
      <Text style={{ color: '#bbb', marginTop: 12 }}>{status}</Text>
    </View>
    <Text style={caption}>Cosmetic gallery, persistent presets and client-wide Discord render hooks are under development.</Text>
  </ScrollView>
}
