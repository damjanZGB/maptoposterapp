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

  useEffect(() => {
    // Fetch available themes
    axios.get('/api/themes')
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
      const response = await axios.post('/api/generate', {
        city,
        country,
        theme,
        width: 12,
        height: 16,
        scale: 12000,
        quality
      })

      if (response.data.url) {
        setPosterUrl(response.data.url)
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

  return (
    <div className="container">
      <header>
        <h1>MapToPoster</h1>
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
                <a href={posterUrl} download className="btn-secondary">Download Preview</a>
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
