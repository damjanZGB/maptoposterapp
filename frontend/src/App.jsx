import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [theme, setTheme] = useState('terracotta')
  const [themes, setThemes] = useState([])
  const [loading, setLoading] = useState(false)
  const [posterUrl, setPosterUrl] = useState(null)
  const [error, setError] = useState(null)

  // Use environment variable for API URL in production (split hosting)
  // Fallback to relative path for local dev (via proxy) or Docker compose
  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

  useEffect(() => {
    // Fetch available themes
    axios.get(`${API_BASE_URL}/themes`)
      .then(response => {
        setThemes(response.data.themes)
      })
      .catch(err => {
        console.error("Failed to fetch themes", err)
        // Fallback or show error
      })
  }, [])

  const generateMap = async (quality = 'preview') => {
    setLoading(true)
    setError(null)
    // Don't clear posterUrl if generating high-res from preview
    if (quality === 'preview') setPosterUrl(null)

    try {
      const response = await axios.post(`${API_BASE_URL}/generate`, {
        city,
        country,
        theme,
        width: 12,
        height: 16,
        scale: 12000,
        quality
      })

      if (response.data.url) {
        // Construct full URL for split hosting (frontend on different domain than backend)
        const fullUrl = response.data.url.startsWith('http')
          ? response.data.url
          : `${API_BASE_URL}${response.data.url}`;
        setPosterUrl(fullUrl)
      }
    } catch (err) {
      console.error("Generation failed", err)
      setError("Failed to generate poster. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    generateMap('preview')
  }

  const handleDownload = async () => {
    if (!posterUrl) return
    try {
      const response = await fetch(posterUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      // Extract filename
      const filename = posterUrl.split('/').pop() || `map-${city}-${country}.png`
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Download failed", err)
      setError("Failed to download. Please try again.")
    }
  }

  return (
    <div className="container">
      <header>
        <h1>dAisy's maps</h1>
        <p>Create beautiful minimalist map posters.</p>
      </header>

      <main>
        <div className="controls">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Paris"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="country">Country</label>
              <input
                type="text"
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. France"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="theme">Theme</label>
              <select
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              >
                {themes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
                {!themes.includes('terracotta') && <option value="terracotta">Terracotta</option>}
              </select>
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Generating...' : 'Generate Preview'}
            </button>

            {error && <p className="error">{error}</p>}
          </form>
        </div>

        <div className="preview">
          {posterUrl ? (
            <div className="poster-container">
              <img src={posterUrl} alt={`Map poster of ${city}`} />
              <div className="actions">
                <button onClick={handleDownload} className="btn-secondary">Download Preview</button>
                <button
                  onClick={() => generateMap('print')}
                  disabled={loading}
                  className="btn-primary"
                  style={{ marginTop: '1rem' }}
                >
                  {loading ? 'Processing...' : 'Generate High-Res Print'}
                </button>
              </div>
            </div>
          ) : (
            <div className="placeholder">
              <p>Enter a city to generate a preview</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
