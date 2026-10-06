import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchInput } from '@/components/search/SearchInput'

/** Compact Home search. Submitting opens /search?q=… . */
export function HomeSearch() {
  const navigate = useNavigate()
  const [value, setValue] = useState('')

  return (
    <SearchInput
      id="home-search"
      value={value}
      onChange={setValue}
      onSubmit={(q) => navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')}
      placeholder="Search the Employee Portal..."
      label="Search the Employee Portal"
      showButton
      className="max-w-2xl"
    />
  )
}
