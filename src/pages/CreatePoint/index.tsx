import React, { useEffect, useState, ChangeEvent, FormEvent} from 'react'
import { Link, useHistory } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { Map, TileLayer, Marker } from 'react-leaflet'
import { LeafletMouseEvent } from 'leaflet'
import api from '../../services/api'
import axios from 'axios'

import logo from '../../assets/logo.svg'

import './styles.css'

interface Item {
    id: number,
    title: string,
    image: string,
    image_url: string
}

interface City {
    name: string,
    id: string
}

interface IBGEUFResponse {
    sigla: string
}

interface IBGECityResponse {
    id: string,
    nome: string
}

const CreatePoint = () => {
    const [items, setItems] = useState<Item[]>([])
    const [UFs, setUFs] = useState<string[]>([])
    const [cities, setCities] = useState<City[]>([])

    const [initialPosition, setInitialPosition] = useState<[number, number]>([0,0])

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: ''
    })

    const [selectedUF, setSelectedUF] = useState<string>('0')
    const [selectedCity, setSelectedCity] = useState<string>('0')
    const [selectedItems, setSelectedItems] = useState<number[]>([])
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0])

    const history = useHistory()

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords

            setInitialPosition([latitude, longitude])
        })
    },[])

    useEffect(() => {
        api.get('items').then(response => {
            setItems(response.data)
        })
    }, [])

    useEffect(() => {
        axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
            .then(response => {
                setUFs(response.data.map(uf => uf.sigla))
            })
    }, [])

    useEffect(() => {
        if (selectedUF === '0') {
            return
        }
        
        axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF}/distritos`)
            .then(response => {
                setCities(response.data.map(city => {
                    return {
                        name: city.nome,
                        id: city.id
                    }
                }))
            })
    }, [selectedUF])

    function handleSelectUF(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedUF(event.target.value)
    }

    function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedCity(event.target.value)
    }

    function handleMapClick(event: LeafletMouseEvent) {
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng
        ])
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target
        
        setFormData({
            ...formData,
            [name]: value
        })
    }

    function handleSelectItem(id: number) {
        const isAlreadySelected = selectedItems.includes(id)
        
        if (isAlreadySelected) {
            const items = selectedItems.filter(item => item !== id)
            setSelectedItems(items)
        } else {
            setSelectedItems([ ...selectedItems, id ])
        }

    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()

        const {name, email, whatsapp} = formData
        const uf = selectedUF
        const city = selectedCity
        const [latitude, longitude] = selectedPosition
        const items = selectedItems

        const data = {
            name,
            email,
            whatsapp,
            uf,
            city,
            latitude,
            longitude,
            items
        }

        await api.post('points', data)
        alert('Ponto de Coleta cadastrado com sucesso!')

        history.push('/')
    }

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta"/>

                <Link to="/">
                    <FiArrowLeft />
                    Votar para home
                </Link>
            </header>
            <form autoComplete="off" onSubmit={handleSubmit}>
                <h1>Cadastro do<br></br>ponto de coleta</h1>
                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input 
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input 
                            type="email"
                            name="email"
                            id="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">Whatsapp</label>
                            <input 
                            type="text"
                            name="whatsapp"
                            id="whatsapp"
                            value={formData.whatsapp}
                            onChange={handleInputChange}
                            required
                            />
                        </div>
                    </div>
                </fieldset>
                
                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>

                    <Map
                        center={initialPosition}
                        zoom={15}
                        onClick={handleMapClick}
                    >
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker position={selectedPosition} />
                    </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select
                                name="uf" 
                                id="uf"
                                value={selectedUF}
                                onChange={handleSelectUF}
                                required
                            >
                                <option value="0">Selecione uma UF</option>
                                {UFs.map(UF => (
                                    <option key={UF} value={UF}>{UF}</option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select
                                name="city"
                                id="city"
                                value={selectedCity}
                                onChange={handleSelectCity}
                                required
                            >
                                <option value="0">Selecione sua cidade</option>
                                {cities.map(city => (
                                    <option key={city.id} value={city.name}>{city.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>
                
                <fieldset>
                    <legend>
                        <h2>Ítens de Coleta</h2>
                        <span>Selecione um ou mais ítens abaixo</span>
                    </legend>

                    <ul className="items-grid">
                        {items.map(item => ( 
                            <li
                                key={item.id}
                                onClick={() => handleSelectItem(item.id)}
                                className={selectedItems.includes(item.id) ? 'selected' : ""}
                            >
                                <img src={item.image_url} alt={item.title}/>
                                <span>{item.title}</span>
                            </li>
                        ))}
                    </ul>
                </fieldset>
                <button type="submit">Cadastrar ponto de coleta</button>
            </form>
        </div>
    )
}

export default CreatePoint