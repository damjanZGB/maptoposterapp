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
    axios.get('http://localhost:8000/themes')
      .then(response => {
        setThemes(response.data.themes)
      })
      .catch(err => {
        console.error("Failed to fetch themes", err)
        // Fallback or show error
      })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setPosterUrl(null)

    try {
      const response = await axios.post('http://localhost:8000/generate', {
        city,
        country,
        theme,
        width: 12,
        height: 16,
        scale: 12000 // Default scale for now
      })

      if (response.data.url) {
        setPosterUrl(`http://localhost:8000${response.data.url}`)
      }
    } catch (err) {
      console.error("Generation failed", err)
      setError("Failed to generate poster. Please try again.")
    } finally {
      setLoading(false)
    }
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

            <button type="submit" disabled={loading}>
              {loading ? 'Generating...' : 'Generate Poster'}
            </button>

            {error && <p className="error">{error}</p>}
          </form>
        </div>

        <div className="preview">
          {posterUrl ? (
            <div className="poster-container">
              <img src={posterUrl} alt={`Map poster of ${city}`} />
              <a href={posterUrl} download className="download-btn">Download High-Res</a>
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
