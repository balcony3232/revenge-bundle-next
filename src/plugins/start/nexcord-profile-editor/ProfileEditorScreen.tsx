import { useEffect, useState } from 'react'
import { getJsonStorage, pluginStoragePathFor } from '@revenge-mod/json-storage'
import { ScrollView, View, Text, TextInput, Pressable, Image, Share } from 'react-native'
import { scanProfileModules, formatDiagnosticReport } from './diagnostics'
import { saveLocalProfile } from '~/nexcord/plugins/profile-storage'
import type { ProfileAppearance } from '~/nexcord/plugins/profile-editor'
import { getNativeEditorDiscovery, subscribeNativeEditorDiscovery } from './native-editor'

const panel = { backgroundColor: '#292930', borderRadius: 14, padding: 14, marginBottom: 12 } as const
const field = { backgroundColor: '#1d1d23', color: '#fff', borderRadius: 9, padding: 12, marginTop: 6 } as const
const caption = { color: '#bbb', fontSize: 13 } as const

export default function NexcordProfileEditorScreen() {
  const [nativeEditor, setNativeEditor] = useState(getNativeEditorDiscovery())
  const [report, setReport] = useState('')
  const [saveReport, setSaveReport] = useState('')
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

  useEffect(() => subscribeNativeEditorDiscovery(() => setNativeEditor(getNativeEditorDiscovery())), [])

  useEffect(() => {
    let active = true
    const storage = getJsonStorage<{ entries: { userId: string; appearance: ProfileAppearance }[] }>(
      pluginStoragePathFor('nexcord.profile-editor'),
    )
    void storage.get().then(saved => {
      if (!active) return
      const first = saved?.entries?.[0]
      if (!first) return
      setUserId(first.userId)
      setUsername(first.appearance.username ?? '')
      setDisplayName(first.appearance.displayName ?? '')
      setBio(first.appearance.bio ?? '')
      setAvatarUrl(first.appearance.avatarUrl ?? '')
      setBannerUrl(first.appearance.bannerUrl ?? '')
      setBadgeIds(first.appearance.badgeIds?.join(', ') ?? '')
      setEffectId(first.appearance.effectId ?? '')
      setAccent(first.appearance.accentColor === undefined ? '#7162DA' : '#' + first.appearance.accentColor.toString(16).padStart(6, '0'))
      setPreview(first.appearance)
      setStatus('Restored your locally saved appearance. Native Discord rendering is still pending.')
    }).catch(() => { if (active) setStatus('Could not restore saved appearance') })
    return () => { active = false }
  }, [])

  const save = async () => {
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
      await saveLocalProfile(userId.trim(), appearance)
      setPreview(appearance)
      setStatus('Saved locally on this device. Discord-wide rendering is not yet connected.')
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
    <Text style={{ color: '#a99cf8', marginBottom: 12 }}>{nativeEditor.path ? 'Native profile editor module detected (integration pending)' : 'Native profile editor module not yet identified on this Discord version'}</Text>
    <View style={panel}>
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Native Save integration</Text>
      <Text style={caption}>Detected modules: {nativeEditor.exportNames.length ? nativeEditor.exportNames.join(', ') : 'none yet'}</Text>
      <Text style={{ color: '#ddd', marginTop: 8 }}>Observed native Save calls: {nativeEditor.saveCalls}</Text>
      <Text style={caption}>Form renders: {nativeEditor.formCalls} · Form hook calls: {nativeEditor.hookCalls}</Text>
      <Text selectable style={caption}>Probe status: {nativeEditor.observerStatus.join(' | ') || 'pending'}</Text>
      <Text selectable style={caption}>Argument shapes: {nativeEditor.saveArgumentShapes.join(' | ') || 'none observed'}</Text>
      <Text style={{ color: '#a99cf8', marginTop: 8 }}>{nativeEditor.exportNames.includes('saveProfileAndAccountChanges') ? 'Save handler located. Metadata-only observer active; Discord Save behaviour is unchanged.' : 'Save handler not detected yet. Open the native Profile screen, then return.'}</Text>
      <Pressable onPress={() => { const message = 'Nexcord native form observation v3\\n' + nativeEditor.exportNames.map(name => name + ': detected').join('\\n') + '\\nObserved Save calls: ' + nativeEditor.saveCalls + '\\nForm renders: ' + nativeEditor.formCalls + '\\nForm hook calls: ' + nativeEditor.hookCalls + '\\nProbe status: ' + nativeEditor.observerStatus.join(' | ') + '\\nArgument shapes: ' + (nativeEditor.saveArgumentShapes.join(' | ') || 'none'); setSaveReport(message); void Share.share({ message }) }} style={{ backgroundColor: '#40404c', padding: 12, borderRadius: 9, marginTop: 12 }}><Text style={{ color: '#fff', fontWeight: '700' }}>Share Save diagnostics</Text></Pressable>
      {saveReport ? <Text selectable style={{ color: '#bbb', fontSize: 12, marginTop: 8 }}>{saveReport}</Text> : null}
    </View>
    <View style={panel}>
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Diagnostics</Text>
      <Text style={caption}>Open Discord's normal Customize Profile page first, then return here and scan. Only module IDs and relevant export names are collected; no messages or account details.</Text>
      <Pressable onPress={() => {
        try { setReport(formatDiagnosticReport(scanProfileModules())) }
        catch (error) { setReport('Scan failed: ' + String(error)) }
      }} style={{ backgroundColor: '#7162DA', padding: 12, borderRadius: 9, marginTop: 12 }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Scan loaded modules</Text>
      </Pressable>
      {report ? <>
        <Text selectable style={{ color: '#ddd', marginTop: 12, fontSize: 12 }} numberOfLines={14}>{report}</Text>
        <Pressable onPress={() => { void Share.share({ message: report }) }} style={{ padding: 12, marginTop: 8, borderRadius: 9, backgroundColor: '#40404c' }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Share / copy report</Text>
        </Pressable>
      </> : null}
    </View>
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
